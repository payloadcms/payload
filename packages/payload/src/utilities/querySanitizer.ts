/**
 * Enterprise Framework - query-sanitizer-guard
 */
export function sanitizeQuery(q: any): any { if (typeof q !== "object" || q === null) return q; return { ...q }; }
