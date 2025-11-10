/**
 * Atomic access checkers for composable access control.
 *
 * These are fine-grained, single-purpose functions that can be combined
 * using composition utilities (or, and, conditional) from the ecommerce plugin.
 *
 * @example
 * ```ts
 * import { or } from '@payloadcms/plugin-ecommerce'
 * import { isAdmin, isCustomer } from './checkers'
 *
 * const canManageOrders = or(isAdmin, isCustomer)
 * ```
 */

export { isAdmin } from './isAdmin'
export { isAuthenticated } from './isAuthenticated'
export { isCustomer } from './isCustomer'
export { isDocumentOwner } from './isDocumentOwner'
