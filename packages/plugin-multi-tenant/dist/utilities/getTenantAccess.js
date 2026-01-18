import { defaults } from '../defaults.js';
import { getUserTenantIDs } from './getUserTenantIDs.js';
export function getTenantAccess({ fieldName, tenantsArrayFieldName = defaults.tenantsArrayFieldName, tenantsArrayTenantFieldName = defaults.tenantsArrayTenantFieldName, user }) {
    const userAssignedTenantIDs = getUserTenantIDs(user, {
        tenantsArrayFieldName,
        tenantsArrayTenantFieldName
    });
    return {
        [fieldName]: {
            in: userAssignedTenantIDs || []
        }
    };
}

//# sourceMappingURL=getTenantAccess.js.map