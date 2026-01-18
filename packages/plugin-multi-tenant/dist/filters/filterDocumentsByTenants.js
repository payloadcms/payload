import { defaults } from '../defaults.js';
import { getCollectionIDType } from '../utilities/getCollectionIDType.js';
import { getTenantFromCookie } from '../utilities/getTenantFromCookie.js';
import { getUserTenantIDs } from '../utilities/getUserTenantIDs.js';
export const filterDocumentsByTenants = ({ docTenantID, filterFieldName, req, tenantsArrayFieldName = defaults.tenantsArrayFieldName, tenantsArrayTenantFieldName = defaults.tenantsArrayTenantFieldName, tenantsCollectionSlug, userHasAccessToAllTenants })=>{
    const idType = getCollectionIDType({
        collectionSlug: tenantsCollectionSlug,
        payload: req.payload
    });
    // scope results to selected tenant
    const selectedTenant = docTenantID ?? getTenantFromCookie(req.headers, idType);
    if (selectedTenant) {
        return {
            [filterFieldName]: {
                in: [
                    selectedTenant
                ]
            }
        };
    }
    if (req.user && userHasAccessToAllTenants(req?.user)) {
        return null;
    }
    // scope to user assigned tenants
    const userAssignedTenants = getUserTenantIDs(req.user, {
        tenantsArrayFieldName,
        tenantsArrayTenantFieldName
    });
    if (userAssignedTenants.length > 0) {
        return {
            [filterFieldName]: {
                in: userAssignedTenants
            }
        };
    }
    // no tenant selected and no user tenants, return null to allow access control to handle it
    return null;
};

//# sourceMappingURL=filterDocumentsByTenants.js.map