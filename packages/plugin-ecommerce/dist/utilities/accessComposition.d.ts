import type { Access } from 'payload';
/**
 * Combines multiple access functions with OR logic.
 *
 * Logic:
 * - If ANY function returns `true` → return `true` (full access, short-circuit)
 * - If ALL functions return `false` → return `false` (no access)
 * - If any functions return `Where` queries → combine them with OR logic
 *
 * @example
 * ```ts
 * const canCreate = or(
 *   isAdmin,
 *   isAuthenticated,
 *   conditional(allowGuestAccess, isGuest)
 * )
 * ```
 */
export declare const accessOR: (...accessFunctions: Access[]) => Access;
/**
 * Combines multiple access functions with AND logic.
 *
 * Logic:
 * - If ANY function returns `false` → return `false` (no access, short-circuit)
 * - If ALL functions return `true` → return `true` (full access)
 * - If any functions return `Where` queries → combine them with AND logic
 *
 * @example
 * ```ts
 * const canUpdate = and(
 *   isAuthenticated,
 *   isDocumentOwner
 * )
 * ```
 */
export declare const accessAND: (...accessFunctions: Access[]) => Access;
/**
 * Conditionally applies an access function based on a boolean condition or function.
 *
 * Useful for feature flags and plugin configuration.
 *
 * @param condition - Boolean or function to determine which function to use
 * @param checker - Access function to use if condition is true
 * @param fallback - Access function to use if condition is false (defaults to denying access)
 *
 * @example
 * ```ts
 * const canCreate = or(
 *   isAdmin,
 *   conditional(allowGuestCarts, isGuest)
 * )
 * ```
 */
export declare const conditional: (condition: ((args: any) => boolean) | boolean, accessFunction: Access, fallback?: Access) => Access;
//# sourceMappingURL=accessComposition.d.ts.map