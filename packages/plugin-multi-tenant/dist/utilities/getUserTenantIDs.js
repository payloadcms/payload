import { defaults } from '../defaults.js';
import { extractID } from './extractID.js';
/**
 * Returns array of all tenant IDs assigned to a user
 *
 * @param user - User object with tenants field
 */ export const getUserTenantIDs = (user, options)=>{
    if (!user) {
        return [];
    }
    const tenantsArrayFieldName = options?.tenantsArrayFieldName || defaults.tenantsArrayFieldName;
    const tenantsArrayTenantFieldName = options?.tenantsArrayTenantFieldName || defaults.tenantsArrayTenantFieldName;
    return (Array.isArray(user[tenantsArrayFieldName]) ? user[tenantsArrayFieldName] : [])?.reduce((acc, row)=>{
        if (row[tenantsArrayTenantFieldName]) {
            acc.push(extractID(row[tenantsArrayTenantFieldName]));
        }
        return acc;
    }, []) || [];
};

//# sourceMappingURL=getUserTenantIDs.js.map