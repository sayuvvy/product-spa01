import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'auth_token';
const PKCE_VERIFIER_KEY = 'pkce_code_verifier';

@Injectable({ providedIn: 'root' })
export class AppService {
  public clientId = environment.keycloakClientId;
  public redirectUri = 'http://localhost:4200/';

  private keycloakTokenUrl =
    `${environment.keycloakUrl}/realms/${environment.keycloakRealm}/protocol/openid-connect/token`;
  private keycloakAuthUrl =
    `${environment.keycloakUrl}/realms/${environment.keycloakRealm}/protocol/openid-connect/auth`;

  constructor(private _http: HttpClient, private _cookieService: CookieService, private _router: Router) { }

  // ─── PKCE helpers ────────────────────────────────────────────────────────────

  /** Generate a cryptographically random code_verifier (RFC 7636 compliant, 43-128 chars) */
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32); // 32 bytes → 43 Base64URL chars
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /** SHA-256 hash the verifier then Base64URL encode → code_challenge */
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  // ─── Auth URL ────────────────────────────────────────────────────────────────

  async getAuthUrl(): Promise<string> {
    const nonce = this.generateCodeVerifier();
    sessionStorage.setItem('pkce_nonce', nonce);

    let url = `${this.keycloakAuthUrl}` +
      `?response_type=code` +
      `&scope=${environment.keycloakScope.split(' ').map(encodeURIComponent).join('%20')}` +
      `&client_id=${encodeURIComponent(this.clientId)}` +
      `&redirect_uri=${encodeURIComponent(this.redirectUri)}` +
      `&nonce=${encodeURIComponent(nonce)}` +
      `&prompt=login`;

    if (environment.pkceEnabled) {
      const verifier = this.generateCodeVerifier();
      sessionStorage.setItem(PKCE_VERIFIER_KEY, verifier);
      const challenge = await this.generateCodeChallenge(verifier);
      url += `&code_challenge=${challenge}&code_challenge_method=S256`;
    }

    console.log('[AUTH URL]', url);
    return url;
  }

  // ─── Token exchange ──────────────────────────────────────────────────────────

  retrieveToken(code: string) {
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('client_id', this.clientId);
    params.append('redirect_uri', this.redirectUri);
    params.append('code', code);

    if (environment.pkceEnabled) {
      const verifier = sessionStorage.getItem(PKCE_VERIFIER_KEY);
      console.log('[PKCE] code_verifier:', verifier);
      console.log('[PKCE] code length:', code.length);
      if (!verifier) {
        alert('PKCE verifier missing. Please try logging in again.');
        return;
      }
      params.append('code_verifier', verifier);
    }

    if (environment.keycloakClientSecret) {
      params.append('client_secret', environment.keycloakClientSecret);
    }

    const headers =
      new HttpHeaders({ 'Content-type': 'application/x-www-form-urlencoded; charset=utf-8' });

    this._http.post(this.keycloakTokenUrl, params.toString(), { headers })
      .subscribe({
        next: (data) => {
          sessionStorage.removeItem(PKCE_VERIFIER_KEY);
          sessionStorage.removeItem('pkce_nonce');
          this.saveToken(data);
        },
        error: (err) => {
          sessionStorage.removeItem('code_exchanging');
          alert('Login failed: ' + (err?.error?.error_description || 'Invalid Credentials'));
        }
      });
  }

  saveToken(token: any) {
    const expireDate = new Date().getTime() + (1000 * token.expires_in);
    this._cookieService.set('access_token', token.access_token, expireDate);
    sessionStorage.removeItem('code_exchanging');
    console.log('Obtained Access token');
    // Navigate cleanly to home without query params — avoids redirect loop
    this._router.navigate(['/home'], { replaceUrl: true });
  }

  getResource<T>(resourceUrl: string): Observable<T> {
    const headers = new HttpHeaders({
      'Content-type': 'application/json',
      'Authorization': 'Bearer ' + this._cookieService.get('access_token')
    });
    return this._http.get<T>(`${environment.apiBaseUrl}${resourceUrl}`, { headers });
  }

  checkCredentials() {
    return this._cookieService.check('access_token');
  }

  logout() {
    this._cookieService.delete('access_token');
    sessionStorage.removeItem(PKCE_VERIFIER_KEY);
    sessionStorage.removeItem('pkce_nonce');
    window.location.reload();
  }
}