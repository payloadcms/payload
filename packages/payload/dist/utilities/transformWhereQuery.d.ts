import type { Where } from '../types/index.js';
/**
 * Transforms a basic "where" query into a format in which the "where builder" can understand.
 * Even though basic queries are valid, we need to hoist them into the "and" / "or" format.
 * Use this function alongside `validateWhereQuery` to check that for valid queries before transforming.
 * @example
 * Inaccurate: [text][equals]=example%20post
 * Accurate: [or][0][and][0][text][equals]=example%20post
 */
export declare const transformWhereQuery: (whereQuery: Where) => Where;
//# sourceMappingURL=transformWhereQuery.d.ts.map