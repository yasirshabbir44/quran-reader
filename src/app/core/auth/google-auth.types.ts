export interface GoogleUserProfile {
  /** Stable Google account identifier (treat as the user's unique key). */
  readonly sub: string;
  readonly email: string;
  readonly name: string;
  readonly picture: string | null;
}

export interface GoogleTokenResponse {
  readonly access_token?: string;
  readonly expires_in?: number;
  readonly scope?: string;
  readonly token_type?: string;
  readonly error?: string;
  readonly error_description?: string;
}

export interface GoogleTokenClient {
  requestAccessToken(overrideConfig?: { prompt?: string }): void;
}

export interface GoogleAccountsOauth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    prompt?: string;
    callback: (response: GoogleTokenResponse) => void;
    error_callback?: (err: { type: string; message?: string }) => void;
  }): GoogleTokenClient;
  revoke(token: string, done?: () => void): void;
  hasGrantedAllScopes?(
    response: GoogleTokenResponse,
    firstScope: string,
    ...restScopes: string[]
  ): boolean;
}

export interface GoogleAccountsNamespace {
  oauth2: GoogleAccountsOauth2;
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccountsNamespace };
  }
}
