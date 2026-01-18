import { APIError } from 'payload';
import { getTenantOptions } from '../utilities/getTenantOptions.js';
export const getTenantOptionsEndpoint = ({ tenantsArrayFieldName, tenantsArrayTenantFieldName, tenantsCollectionSlug, useAsTitle, userHasAccessToAllTenants })=>({
        handler: async (req)=>{
            const { payload, user } = req;
            if (!user) {
                throw new APIError('Unauthorized', 401);
            }
            const tenantOptions = await getTenantOptions({
                payload,
                tenantsArrayFieldName,
                tenantsArrayTenantFieldName,
                tenantsCollectionSlug,
                useAsTitle,
                user,
                userHasAccessToAllTenants
            });
            return new Response(JSON.stringify({
                tenantOptions
            }));
        },
        method: 'get',
        path: '/populate-tenant-options'
    });

//# sourceMappingURL=getTenantOptionsEndpoint.js.map