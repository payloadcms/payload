/**
 * A function that takes request headers and an idType and returns the current tenant ID from the cookie
 *
 * @param headers Headers, usually derived from req.headers or next/headers
 * @param idType can be 'number' | 'text', usually derived from payload.db.defaultIDType
 * @returns string | number | null
 */
export declare function getTenantFromCookie(headers: Headers, idType: 'number' | 'text'): null | number | string;
//# sourceMappingURL=getTenantFromCookie.d.ts.map