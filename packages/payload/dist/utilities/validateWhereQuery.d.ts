import type { Where } from '../types/index.js';
/**
 * Validates that a "where" query is in a format in which the "where builder" can understand.
 * Even though basic queries are valid, we need to hoist them into the "and" / "or" format.
 * Use this function alongside `transformWhereQuery` to perform a transformation if the query is not valid.
 * @example
 * Inaccurate: [text][equals]=example%20post
 * Accurate: [or][0][and][0][text][equals]=example%20post
 */
export declare const validateWhereQuery: (whereQuery: Where) => whereQuery is Where;
//# sourceMappingURL=validateWhereQuery.d.ts.map