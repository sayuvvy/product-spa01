# Product SPA

An Angular 21 single-page application that provides a product catalogue browser secured with OAuth2 / PKCE authentication via Keycloak. This is the **frontend tier** of a three-service product platform.

---

## System Context

This SPA is one of three repositories that together form the complete product platform. All three must be running for the full flow to work locally.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Full-Stack Product Platform                                        │
│                                                                     │
│  ┌───────────────────────┐                                         │
│  │  product-spa01        │  Angular 21  — port 4200               │
│  │  (this repo)          │  User-facing product catalogue UI       │
│  └────────┬──────────────┘                                         │
│           │  1. Redirect to Keycloak login page                    │
│           │  2. Authorization code returned in callback URL        │
│           │  3. Token exchange (PKCE)                              │
│           ▼                                                         │
│  ┌───────────────────────┐                                         │
│  │  auth-server01        │  Spring Boot + Embedded Keycloak 24    │
│  │  github.com/sayuvvy/  │  Realm: my-realm                       │
│  │  auth-server01        │  Client: my-app-client  — port 8082    │
│  └────────┬──────────────┘                                         │
│           │  Issues JWT with products:read / products:write scopes │
│           ▼                                                         │
│  ┌───────────────────────┐                                         │
│  │  product-domain-      │  Spring Boot 3.2 Resource Server       │
│  │  service01            │  REST API: /api/v1/products             │
│  │  github.com/sayuvvy/  │  H2 in-memory + Flyway — port 8085     │
│  │  product-domain-      │                                         │
│  │  service01            │                                         │
│  └───────────────────────┘                                         │
└─────────────────────────────────────────────────────────────────────┘
```

| Repository | Role | Port (local) |
|---|---|---|
| [auth-server01](https://github.com/sayuvvy/auth-server01) | Identity Provider (embedded Keycloak 24) | 8082 |
| [product-domain-service01](https://github.com/sayuvvy/product-domain-service01) | Product REST API (OAuth2 Resource Server) | 8085 |
| **product-spa01** (this repo) | Angular frontend | 4200 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21.2 |
| Language | TypeScript 5.9 |
| Routing | Angular Router |
| HTTP | Angular HttpClient (`HttpClientModule`) |
| Authentication | OAuth2 Authorization Code + PKCE (native Web Crypto API) |
| Token storage | Browser cookies via `ngx-cookie-service` 21.3 |
| Testing | Vitest 4.0 |
| Code quality | Prettier 3.8 |
| Build | Angular CLI 21.2 / `@angular/build` |
| Node | npm 11.6 |

---

## Features

- **OAuth2 login** — redirects user to Keycloak, handles authorization code callback, exchanges code for JWT using PKCE
- **Persistent session** — access token stored in a cookie so page refresh does not require re-login
- **Product catalogue** — fetches all products from the REST API using the Bearer token and renders a list
- **Auth-gated content** — product list is only shown when the user is authenticated; unauthenticated access shows an error message
- **Logout** — clears token cookie and session storage, returns user to login screen

---

## User Journey

```
User visits /home
      │
      ├── Not logged in?
      │     └── Shows [ Login ] button
      │           └── Click → redirect to Keycloak login page
      │                 └── User enters credentials
      │                       └── Keycloak redirects back to /home?code=...
      │                             └── HomeComponent detects code in URL
      │                                   └── Exchanges code + PKCE verifier for JWT
      │                                         └── Saves token in cookie
      │                                               └── Navigates to /home (clean URL)
      │
      └── Logged in?
            └── Shows "Welcome !!" + [ Logout ] button
                  └── Renders <app-product> component
                        └── GET /api/v1/products (Authorization: Bearer <token>)
                              └── Displays product list (name, description, price)
```

---

## OAuth2 / PKCE Authentication Flow

The SPA implements the **Authorization Code Flow with PKCE** (RFC 7636), which is the recommended approach for public browser clients.

```
SPA (browser)                    Keycloak (port 8082)            Product API (port 8085)
      │                                   │                               │
      │── generateCodeVerifier() ────────►│                               │
      │── generateCodeChallenge(v) ───────►│                               │
      │                                   │                               │
      │── GET /auth?code_challenge=... ──►│                               │
      │          client_id=my-app-client  │                               │
      │          response_type=code       │                               │
      │          scope=openid write read  │                               │
      │                                   │                               │
      │◄── redirect /home?code=ABC ───────│                               │
      │                                   │                               │
      │── POST /token                     │                               │
      │     code=ABC                      │                               │
      │     code_verifier=...  ──────────►│                               │
      │                                   │                               │
      │◄── { access_token: JWT } ─────────│                               │
      │                                   │                               │
      │── saveToken() → cookie            │                               │
      │                                   │                               │
      │── GET /api/v1/products ───────────────────────────────────────►  │
      │     Authorization: Bearer JWT     │                               │
      │                                   │                               │
      │◄── [ { id, name, description, price }, ... ] ───────────────────  │
```

**PKCE is enabled in the development environment** (`pkceEnabled: true`) and disabled in the default production config (can be enabled once the production Keycloak client is configured for PKCE).

---

## Project Structure

```
PRODUCT-SPA/ProductSPA/product-spa/
├── src/
│   ├── app/
│   │   ├── home/
│   │   │   ├── home.ts          # OAuth callback handler + login/logout
│   │   │   ├── home.html        # Login button / Welcome + product view
│   │   │   ├── home.css
│   │   │   └── home.spec.ts
│   │   ├── product/
│   │   │   ├── product.ts       # Fetches + renders product list
│   │   │   ├── product.html     # Product list template (name, description, price)
│   │   │   ├── product.css
│   │   │   └── product.spec.ts
│   │   ├── services/
│   │   │   └── app.ts           # AppService — all auth + API logic
│   │   ├── models/
│   │   │   └── product.model.ts # ProductModel interface
│   │   ├── app.ts               # Root AppComponent
│   │   ├── app.html             # Root template with <router-outlet>
│   │   ├── app.css
│   │   ├── app-module.ts        # Module: BrowserModule, HttpClientModule, CookieService
│   │   ├── app-routing-module.ts
│   │   └── app.spec.ts
│   ├── environments/
│   │   ├── environment.ts           # Production config
│   │   └── environment.development.ts  # Local dev config
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── public/
├── angular.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.spec.json
├── package.json
└── .prettierrc
```

---

## Routing

| Path | Component | Description |
|---|---|---|
| `/` | — | Redirects to `/home` |
| `/home` | `HomeComponent` | Login page + OAuth callback handler. Renders product list when authenticated. |
| `/products` | `ProductComponent` | Standalone product list view |
| `/**` | — | Wildcard — redirects to `/home` |

---

## Data Model

### `ProductModel` (TypeScript interface)

| Field | Type | Description |
|---|---|---|
| `id` | `number` | Unique product identifier |
| `name` | `string` | Product display name |
| `description` | `string` | Product description |
| `price` | `number` | Product price |

---

## AppService — Key Responsibilities

Located at `src/app/services/app.ts`, this is the single service handling both authentication and API access.

| Method | Purpose |
|---|---|
| `getAuthUrl()` | Builds the Keycloak authorization URL with PKCE code challenge; returns a `Promise<string>` |
| `retrieveToken(code)` | POSTs to Keycloak token endpoint with `code` + PKCE verifier; receives JWT |
| `saveToken(token)` | Persists access token in a cookie with expiry; navigates to `/home` |
| `getResource<T>(url)` | GETs `environment.apiBaseUrl + url` with `Authorization: Bearer <token>` header |
| `checkCredentials()` | Returns `true` if a token cookie exists |
| `logout()` | Clears token cookie + session storage; reloads the window |
| `generateCodeVerifier()` | Generates a 32-byte random Base64URL string (PKCE S256 verifier) |
| `generateCodeChallenge(v)` | SHA-256 hashes the verifier via Web Crypto API; Base64URL encodes result |

---

## Environment Configuration

### Development (`environment.development.ts`) — used with `ng serve`

| Variable | Value | Purpose |
|---|---|---|
| `production` | `false` | Disables production optimizations |
| `apiBaseUrl` | `http://localhost:8085/resource-server` | Product API base URL |
| `keycloakUrl` | `http://localhost:8082/auth` | Keycloak server |
| `keycloakRealm` | `my-realm` | Keycloak realm name |
| `keycloakClientId` | `my-app-client` | Keycloak client registered in the realm |
| `keycloakClientSecret` | `""` | Empty — public client |
| `keycloakScope` | `openid write read` | Requested OAuth scopes |
| `pkceEnabled` | `true` | PKCE code challenge enabled |

### Production (`environment.ts`)

| Variable | Value |
|---|---|
| `production` | `true` |
| `apiBaseUrl` | `https://api.productspa.com` |
| `keycloakUrl` | `http://localhost:8082/auth` *(update to production Keycloak URL)* |
| `keycloakClientId` | `newClient` *(update to production client)* |
| `pkceEnabled` | `false` *(enable once prod Keycloak client supports PKCE)* |

---

## Running Locally

### Prerequisites

1. **Node.js 22+** and **npm 11+**
2. **auth-server01** running at `http://localhost:8082`
3. **product-domain-service01** running at `http://localhost:8085`

### Install dependencies

```bash
cd PRODUCT-SPA/ProductSPA/product-spa
npm install
```

### Start development server

```bash
npm start
# or
ng serve
```

The app is available at `http://localhost:4200`.

Angular CLI automatically uses `environment.development.ts` in `ng serve` mode.

### Build for production

```bash
npm run build
```

Output: `dist/product-spa/`

---

## Starting the Full Local Stack

Start all three services in this order:

**1. Identity provider (auth-server01)**
```bash
cd KEYCLOAK/appone
java -Dspring.profiles.active=local -jar target/appone-0.0.1-SNAPSHOT.jar
# Keycloak available at http://localhost:8082/auth
```

**2. Product API (product-domain-service01)**
```bash
cd PRODUCT-DOMAIN-SERV/ProductDomainService
java -Dspring.profiles.active=local -jar target/product-domain-service-1.0.0-SNAPSHOT.jar
# API available at http://localhost:8085/resource-server
```

**3. Angular SPA (this repo)**
```bash
cd PRODUCT-SPA/ProductSPA/product-spa
npm install && npm start
# SPA available at http://localhost:4200
```

Then open `http://localhost:4200` in a browser, click **Login**, authenticate with a test user from `my-realm`, and the product catalogue will load.

---

## Testing

```bash
npm test
```

Tests run with **Vitest** against `tsconfig.spec.json`.

---

## Known Limitations & Future Work

| Area | Current State | Suggested Next Step |
|---|---|---|
| Product display | Shows name, description, price only | Add full field set (SKU, category, brand, status, stock) |
| Filtering / search | Not implemented | Wire up query params to `/api/v1/products?category=&status=` |
| Pagination | Not implemented | Add paginator linked to Spring page response |
| Route guards | None | Add `CanActivate` guard redirecting unauthenticated users to `/home` |
| Token refresh | Not implemented | Handle `401` responses by re-initiating OAuth flow |
| Production Keycloak URL | Placeholder (`localhost:8082`) | Update `environment.ts` with real production Keycloak host |
| PKCE in production | Disabled | Enable once production Keycloak client is configured for public PKCE |
| Error UX | Plain text error message | Toast / notification component |
