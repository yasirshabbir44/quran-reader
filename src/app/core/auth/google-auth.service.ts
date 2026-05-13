import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { GOOGLE_AUTH_CONFIG } from './google-auth.config';
import type {
  GoogleAccountsOauth2,
  GoogleTokenClient,
  GoogleTokenResponse,
  GoogleUserProfile,
} from './google-auth.types';

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';
const LS_USER_KEY = 'surah-reader-google-user';
const TOKEN_EXPIRY_BUFFER_MS = 30_000;

export type GoogleAuthError =
  | 'script-load-failed'
  | 'config-missing'
  | 'consent-required'
  | 'popup-closed'
  | 'token-failed'
  | 'profile-failed';

/**
 * Google Identity Services-backed sign-in. Owns the access token, refreshes it
 * silently when possible, and exposes a small signal-based surface that the
 * rest of the app consumes (bookmark repository, header chip, etc).
 *
 * The service degrades gracefully when:
 *   - running under SSR (no window),
 *   - no client id is configured,
 *   - the gsi/client script fails to load (e.g. offline),
 *   - the user closes the consent popup.
 */
@Injectable({ providedIn: 'root' })
export class GoogleAuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly config = inject(GOOGLE_AUTH_CONFIG);

  readonly user = signal<GoogleUserProfile | null>(null);
  readonly initializing = signal(true);
  readonly authInProgress = signal(false);
  readonly lastError = signal<GoogleAuthError | null>(null);

  /** True when both the runtime is a browser and a real client id is configured. */
  readonly available = computed(() => this.browser && this.hasValidClientId());

  /** True when the user has an active profile (signed in, possibly with stale token). */
  readonly isSignedIn = computed(() => this.user() !== null);

  private accessToken: string | null = null;
  private accessTokenExpiresAt = 0;
  private scriptPromise: Promise<void> | null = null;
  private tokenClient: GoogleTokenClient | null = null;
  private pendingResolve: ((token: string | null) => void) | null = null;
  private readonly browser: boolean;

  constructor() {
    this.browser = isPlatformBrowser(this.platformId);
    if (!this.browser) {
      this.initializing.set(false);
      return;
    }
    if (!this.hasValidClientId()) {
      this.lastError.set('config-missing');
      this.initializing.set(false);
      return;
    }

    this.user.set(this.readCachedProfile());

    void this.ensureGisLoaded()
      .catch(() => {
        this.lastError.set('script-load-failed');
      })
      .finally(() => {
        this.initializing.set(false);
      });
  }

  /** Initiates the sign-in popup. Resolves true on success, false otherwise. */
  async signIn(): Promise<boolean> {
    if (!this.available()) {
      return false;
    }
    this.lastError.set(null);
    const token = await this.requestToken('consent');
    if (!token) {
      return false;
    }
    const profile = await this.fetchProfile(token);
    if (!profile) {
      this.lastError.set('profile-failed');
      return false;
    }
    this.user.set(profile);
    this.persistProfile(profile);
    return true;
  }

  /** Revokes the access token, clears local cache, drops the user. */
  signOut(): void {
    if (!this.browser) {
      return;
    }
    const token = this.accessToken;
    this.accessToken = null;
    this.accessTokenExpiresAt = 0;
    this.user.set(null);
    this.lastError.set(null);
    try {
      localStorage.removeItem(LS_USER_KEY);
    } catch {
      /* ignore */
    }
    if (token) {
      const oauth2 = this.oauth2();
      if (oauth2) {
        try {
          oauth2.revoke(token);
        } catch {
          /* ignore */
        }
      }
    }
  }

  /**
   * Returns a valid access token suitable for the configured scopes.
   * Attempts a silent refresh when the cached token is missing/expired.
   * Returns null when not signed in or when refresh is blocked.
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.available() || !this.user()) {
      return null;
    }
    if (this.accessToken && Date.now() < this.accessTokenExpiresAt - TOKEN_EXPIRY_BUFFER_MS) {
      return this.accessToken;
    }
    return this.requestToken('');
  }

  private hasValidClientId(): boolean {
    const id = (this.config.clientId ?? '').trim();
    return id.length > 0 && !id.startsWith('<') && id.includes('.apps.googleusercontent.com');
  }

  private async requestToken(prompt: string): Promise<string | null> {
    try {
      await this.ensureGisLoaded();
    } catch {
      this.lastError.set('script-load-failed');
      return null;
    }
    const client = this.getOrCreateTokenClient();
    if (!client) {
      return null;
    }
    if (this.pendingResolve) {
      // Coalesce concurrent refresh attempts; reuse the in-flight resolution.
      return new Promise<string | null>((resolve) => {
        const prev = this.pendingResolve;
        this.pendingResolve = (token) => {
          prev?.(token);
          resolve(token);
        };
      });
    }
    this.authInProgress.set(true);
    return new Promise<string | null>((resolve) => {
      this.pendingResolve = (token) => {
        this.pendingResolve = null;
        this.authInProgress.set(false);
        resolve(token);
      };
      try {
        client.requestAccessToken({ prompt });
      } catch {
        this.completePending(null, 'token-failed');
      }
    });
  }

  private getOrCreateTokenClient(): GoogleTokenClient | null {
    if (this.tokenClient) {
      return this.tokenClient;
    }
    const oauth2 = this.oauth2();
    if (!oauth2) {
      return null;
    }
    try {
      this.tokenClient = oauth2.initTokenClient({
        client_id: this.config.clientId,
        scope: this.config.scopes.join(' '),
        callback: (response: GoogleTokenResponse) => this.onTokenResponse(response),
        error_callback: (err) => {
          const type = err?.type ?? 'token-failed';
          this.completePending(
            null,
            type === 'popup_closed' ? 'popup-closed' : 'token-failed',
          );
        },
      });
    } catch {
      this.lastError.set('token-failed');
      return null;
    }
    return this.tokenClient;
  }

  private onTokenResponse(response: GoogleTokenResponse): void {
    if (response.error || !response.access_token) {
      this.completePending(null, 'token-failed');
      return;
    }
    this.accessToken = response.access_token;
    const expiresIn = Number(response.expires_in ?? 3600);
    this.accessTokenExpiresAt = Date.now() + Math.max(60, expiresIn) * 1000;
    this.completePending(this.accessToken, null);
  }

  private completePending(token: string | null, error: GoogleAuthError | null): void {
    if (error) {
      this.lastError.set(error);
    }
    const cb = this.pendingResolve;
    this.pendingResolve = null;
    this.authInProgress.set(false);
    cb?.(token);
  }

  private async fetchProfile(token: string): Promise<GoogleUserProfile | null> {
    try {
      const res = await fetch(USERINFO_ENDPOINT, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        return null;
      }
      const data = (await res.json()) as Partial<{
        sub: string;
        email: string;
        name: string;
        picture: string;
      }>;
      if (!data.sub) {
        return null;
      }
      return {
        sub: data.sub,
        email: data.email ?? '',
        name: data.name ?? data.email ?? 'Google user',
        picture: data.picture ?? null,
      };
    } catch {
      return null;
    }
  }

  private readCachedProfile(): GoogleUserProfile | null {
    try {
      const raw = localStorage.getItem(LS_USER_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<GoogleUserProfile>;
      if (!parsed || typeof parsed.sub !== 'string' || !parsed.sub) {
        return null;
      }
      return {
        sub: parsed.sub,
        email: parsed.email ?? '',
        name: parsed.name ?? parsed.email ?? 'Google user',
        picture: parsed.picture ?? null,
      };
    } catch {
      return null;
    }
  }

  private persistProfile(profile: GoogleUserProfile): void {
    try {
      localStorage.setItem(LS_USER_KEY, JSON.stringify(profile));
    } catch {
      /* ignore */
    }
  }

  private oauth2(): GoogleAccountsOauth2 | null {
    const view = this.document.defaultView as Window | null;
    return view?.google?.accounts?.oauth2 ?? null;
  }

  private ensureGisLoaded(): Promise<void> {
    if (!this.browser) {
      return Promise.reject(new Error('not-browser'));
    }
    if (this.oauth2()) {
      return Promise.resolve();
    }
    if (this.scriptPromise) {
      return this.scriptPromise;
    }
    this.scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = this.document.querySelector<HTMLScriptElement>(
        `script[src="${GIS_SCRIPT_URL}"]`,
      );
      const onReady = () => {
        if (this.oauth2()) {
          resolve();
        } else {
          reject(new Error('gis-not-ready'));
        }
      };
      if (existing) {
        if (this.oauth2()) {
          resolve();
        } else {
          existing.addEventListener('load', onReady, { once: true });
          existing.addEventListener('error', () => reject(new Error('gis-load-error')), {
            once: true,
          });
        }
        return;
      }
      const script = this.document.createElement('script');
      script.src = GIS_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', onReady, { once: true });
      script.addEventListener('error', () => reject(new Error('gis-load-error')), { once: true });
      this.document.head.appendChild(script);
    });
    return this.scriptPromise;
  }
}
