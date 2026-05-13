import { InjectionToken } from '@angular/core';

export interface GoogleAuthConfig {
  /** OAuth 2.0 Web Client ID issued at https://console.cloud.google.com/apis/credentials. */
  readonly clientId: string;
  /** Scopes requested from Google. Drive AppData is needed for per-user bookmark sync. */
  readonly scopes: readonly string[];
}

export const GOOGLE_AUTH_CONFIG = new InjectionToken<GoogleAuthConfig>('GOOGLE_AUTH_CONFIG');

export const GOOGLE_AUTH_DEFAULT_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.appdata',
] as const;

/**
 * Replace this placeholder with your own OAuth 2.0 Web Client ID.
 *
 * Setup:
 *   1. Visit https://console.cloud.google.com/apis/credentials and create a
 *      Web Application OAuth client.
 *   2. Add your dev origin (e.g. http://localhost:4200) and any production
 *      origins to "Authorized JavaScript origins". No redirect URIs are
 *      required for Google Identity Services token client flow.
 *   3. Enable the "Google Drive API" on the same project so the
 *      drive.appdata scope is granted to your client.
 *   4. Paste the resulting client id below (ends with
 *      "...apps.googleusercontent.com") OR override the GOOGLE_AUTH_CONFIG
 *      provider in app.config.ts at runtime.
 */
export const GOOGLE_OAUTH_CLIENT_ID_PLACEHOLDER =
  '<YOUR_GOOGLE_OAUTH_CLIENT_ID>.apps.googleusercontent.com';
