/**
 * payloadcms/payload - multitenant-access-filter
 */
export function applyTenantFilter(query: any, tenantId: string) { return { ...query, tenant: tenantId }; }
