export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8085/resource-server',
  keycloakUrl: 'http://localhost:8082/auth',
  keycloakRealm: 'my-realm',
  keycloakClientId: 'my-app-client',
  keycloakClientSecret: '',
  keycloakScope: 'openid write read',
  pkceEnabled: true    // ← Keycloak client has pkce.code.challenge.method=S256 enforced
};
