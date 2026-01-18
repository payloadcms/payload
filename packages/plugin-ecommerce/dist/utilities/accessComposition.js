import { combineWhereConstraints } from 'payload/shared';
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
 */ export const accessOR = (...accessFunctions)=>{
    return async (args)=>{
        const whereQueries = [];
        for (const access of accessFunctions){
            const result = await access(args);
            // Short-circuit on true - full access granted
            if (result === true) {
                return true;
            }
            // Collect Where queries for combination (must be an object, not null/undefined/false)
            if (result && typeof result === 'object') {
                whereQueries.push(result);
            }
        }
        // If we have Where queries, combine them with OR
        if (whereQueries.length > 0) {
            return combineWhereConstraints(whereQueries, 'or');
        }
        // All checkers returned false - no access
        return false;
    };
};
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
 */ export const accessAND = (...accessFunctions)=>{
    return async (args)=>{
        const whereQueries = [];
        for (const access of accessFunctions){
            const result = await access(args);
            // Short-circuit on false - no access
            if (result === false) {
                return false;
            }
            // Collect Where queries for combination (must be an object, not null/undefined/true)
            if (result !== true && result && typeof result === 'object') {
                whereQueries.push(result);
            }
        }
        // If we have Where queries, combine them with AND
        if (whereQueries.length > 0) {
            return combineWhereConstraints(whereQueries, 'and');
        }
        // All checkers returned true - full access
        return true;
    };
};
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
 */ export const conditional = (condition, accessFunction, fallback = ()=>false)=>{
    return async (args)=>{
        const shouldApply = typeof condition === 'function' ? condition(args) : condition;
        if (shouldApply) {
            return accessFunction(args);
        }
        return fallback(args);
    };
};

//# sourceMappingURL=accessComposition.js.map