import type { UserWithTenantsField } from '../types.js';
/**
 * Returns array of all tenant IDs assigned to a user
 *
 * @param user - User object with tenants field
 */
export declare const getUserTenantIDs: <IDType extends number | string>(user: null | UserWithTenantsField, options?: {
    tenantsArrayFieldName?: string;
    tenantsArrayTenantFieldName?: string;
}) => IDType[];
//# sourceMappingURL=getUserTenantIDs.d.ts.map