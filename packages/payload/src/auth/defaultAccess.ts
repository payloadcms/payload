import type { PayloadRequest } from '../types/index.js'

/**
 * Intentionally permissive: any authenticated user passes. Framework-owned collections must use
 * `defaultAdminPanelUserAccess` instead, which also requires `config.admin.user`.
 */
export const defaultAccess = ({ req: { user } }: { req: PayloadRequest }): boolean => Boolean(user)
