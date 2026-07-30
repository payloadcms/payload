import type { AuthenticatedUser, SanitizedPermissions } from 'payload'

export type AuthSession = {
  /** Whether qualifying activity has been recorded for the current token. */
  readonly activityRecorded: boolean
  readonly activityTrackingStartsAt: number
  readonly expiresAt: number
  readonly refreshStartsAt: number
  readonly reminderStartsAt: number
}

export type UserWithToken<T = AuthenticatedUser> = {
  /** seconds until expiration */
  exp: number
  refreshedToken?: string
  token?: string
  user: T
}

export type AuthContext<T = AuthenticatedUser> = {
  /** Lifecycle state for the current auth session. */
  authSession?: AuthSession
  fetchFullUser: () => Promise<null | T>
  logOut: () => Promise<boolean>
  /**
   * These are the permissions for the current user from a global scope.
   *
   * When checking for permissions on document specific level, use the `useDocumentInfo` hook instead.
   *
   * @example
   *
   * ```tsx
   * import { useAuth } from 'payload/ui'
   *
   * const MyComponent: React.FC = () => {
   *   const { permissions } = useAuth()
   *
   *   if (permissions?.collections?.myCollection?.create) {
   *     // user can create documents in 'myCollection'
   *   }
   *
   *   return null
   * }
   * ```
   *
   * with useDocumentInfo:
   *
   * ```tsx
   * import { useDocumentInfo } from 'payload/ui'
   *
   * const MyComponent: React.FC = () => {
   *  const { docPermissions } = useDocumentInfo()
   *  if (docPermissions?.create) {
   *   // user can create this document
   *  }
   *  return null
   * } ```
   */
  permissions?: SanitizedPermissions
  refreshCookie: (forceRefresh?: boolean) => void
  refreshCookieAsync: () => Promise<null | T>
  refreshPermissions: () => Promise<void>
  setPermissions: (permissions: SanitizedPermissions) => void
  setUser: (user: null | UserWithToken<T>) => void
  strategy?: string
  token?: string
  user?: null | T
}
