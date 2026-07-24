export const AUTH_SESSION_TEST_ROUTES = {
  ADVANCE_CLOCK: '/test-auth/clock/advance',
  LOGIN: '/test-auth/login',
  RESET: '/test-auth/reset',
  REVOKE: '/test-auth/revoke',
} as const

export const AUTH_SESSION_TEST_STATUS = {
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
} as const

export const AUTH_SESSION_TEST_ADMIN_ROUTES = {
  inactivity: '/logout-inactivity',
  login: '/login',
} as const

export type AuthSessionTestStatus =
  (typeof AUTH_SESSION_TEST_STATUS)[keyof typeof AUTH_SESSION_TEST_STATUS]

export type LoggedOutRoute = keyof typeof AUTH_SESSION_TEST_ADMIN_ROUTES

export const authSessionTokenLifetimeMs = 300_000
export const authSessionUsersSlug = 'auth-session-users'
export const authSessionStrategyName = 'test-provider'
export const authSessionStrategyID = `${authSessionUsersSlug}-${authSessionStrategyName}` as const
export const authSessionRefreshEndpointPathname =
  `/api/${authSessionUsersSlug}/refresh-token` as const
export const authSessionExpirationTestID = 'auth-session-expiration'
export const authSessionExpirationSelector =
  `[data-testid="${authSessionExpirationTestID}"]` as const
