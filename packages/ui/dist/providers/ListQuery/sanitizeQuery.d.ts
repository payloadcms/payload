import type { ListQuery } from 'payload';
/**
 * Sanitize empty strings from the query, e.g. `?preset=`
 * This is how we determine whether to clear user preferences for certain params
 * Once cleared, they are no longer needed in the URL
 */
export declare const sanitizeQuery: (toSanitize: ListQuery) => ListQuery;
//# sourceMappingURL=sanitizeQuery.d.ts.map