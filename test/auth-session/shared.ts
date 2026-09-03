export const AUTH_SESSION_TEST_ROUTES = {
  ADVANCE_CLOCK: '/test-auth/clock/advance',
  ARM_REFRESH_BARRIER: '/test-auth/refresh-barrier/arm',
  LOGIN: '/test-auth/login',
  REFRESH_BARRIER_STATUS: '/test-auth/refresh-barrier/status',
  RELEASE_REFRESH_BARRIER: '/test-auth/refresh-barrier/release',
  RESET: '/test-auth/reset',
  REVOKE: '/test-auth/revoke',
} as const

export const AUTH_SESSION_REFRESH_BARRIER_PHASES = {
  AFTER_ROTATION: 'after-rotation',
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

export type AuthSessionRefreshBarrierPhase =
  (typeof AUTH_SESSION_REFRESH_BARRIER_PHASES)[keyof typeof AUTH_SESSION_REFRESH_BARRIER_PHASES]

export type LoggedOutRoute = keyof typeof AUTH_SESSION_TEST_ADMIN_ROUTES

export const authSessionAccessTokenCookieName = 'auth-session-access-token'
export const authSessionAPIRoute = '/api'
export const authSessionAccessTokenLifetimeMs = 300_000
export const authSessionActivitySelector = '[data-auth-session-activity]'
export const authSessionDebugSelector = '[data-auth-session-debug]'
export const authSessionExpirationAttribute = 'data-auth-session-expires-at'
export const authSessionRefreshTokenCookieName = 'auth-session-refresh-token'
export const authSessionRefreshTokenLifetimeMs = 1_800_000
export const authSessionRefreshWindowSelector = '[data-auth-session-refresh-window]'
export const authSessionRefreshWindowMs = 120_000
export const authSessionLoginButtonLabel = 'Log in with test OAuth provider'
export const authSessionUsersSlug = 'auth-session-users'
export const authSessionStrategyName = 'test-oauth-provider'
export const authSessionStrategyID = `${authSessionUsersSlug}-${authSessionStrategyName}` as const
export const createAuthSessionAPIPath = ({ path }: { path: string }): string =>
  `${authSessionAPIRoute}${path}`
export const createAuthSessionAPIURL = ({
  path,
  serverURL,
}: {
  path: string
  serverURL: string
}): string => `${serverURL}${createAuthSessionAPIPath({ path })}`
export const authSessionRefreshEndpointPathname = createAuthSessionAPIPath({
  path: `/${authSessionUsersSlug}/refresh-token`,
})
