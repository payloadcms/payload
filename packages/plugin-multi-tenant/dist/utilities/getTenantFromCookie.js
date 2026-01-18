import { parseCookies } from 'payload';
import { isNumber } from 'payload/shared';
/**
 * A function that takes request headers and an idType and returns the current tenant ID from the cookie
 *
 * @param headers Headers, usually derived from req.headers or next/headers
 * @param idType can be 'number' | 'text', usually derived from payload.db.defaultIDType
 * @returns string | number | null
 */ export function getTenantFromCookie(headers, idType) {
    const cookies = parseCookies(headers);
    const selectedTenant = cookies.get('payload-tenant') || null;
    return selectedTenant ? idType === 'number' && isNumber(selectedTenant) ? parseFloat(selectedTenant) : selectedTenant : null;
}

//# sourceMappingURL=getTenantFromCookie.js.map