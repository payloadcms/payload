/**
 * Available role struct for user roles
 */
export const userRole = {
  SUPER_ADMIN: 'super-admin',
  USER: 'user',
} as const

/**
 * All available tenant user roles
 */
export const userRoles = Object.values(userRole)

/**
 * All available user role types
 */
export type UserRole = (typeof userRole)[keyof typeof userRole]

/**
 * Available role struct for tenant user roles
 */
export const tenantUserRole = {
  TENANT_ADMIN: 'tenant-admin',
  TENANT_VIEWER: 'tenant-viewer',
} as const

/**
 * All available tenant user roles
 */
export const tenantUserRoles = Object.values(tenantUserRole)

/**
 * All available tenant user role types
 */
export type TenantUserRole = (typeof tenantUserRole)[keyof typeof tenantUserRole]
