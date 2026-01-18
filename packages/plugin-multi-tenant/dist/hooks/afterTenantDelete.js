import { generateCookie, mergeHeaders } from 'payload';
import { getCollectionIDType } from '../utilities/getCollectionIDType.js';
import { getTenantFromCookie } from '../utilities/getTenantFromCookie.js';
/**
 * Add cleanup logic when tenant is deleted
 * - delete documents related to tenant
 * - remove tenant from users
 */ export const addTenantCleanup = ({ collection, enabledSlugs, tenantFieldName, tenantsCollectionSlug, usersSlug, usersTenantsArrayFieldName, usersTenantsArrayTenantFieldName })=>{
    if (!collection.hooks) {
        collection.hooks = {};
    }
    if (!collection.hooks?.afterDelete) {
        collection.hooks.afterDelete = [];
    }
    collection.hooks.afterDelete.push(afterTenantDelete({
        enabledSlugs,
        tenantFieldName,
        tenantsCollectionSlug,
        usersSlug,
        usersTenantsArrayFieldName,
        usersTenantsArrayTenantFieldName
    }));
};
export const afterTenantDelete = ({ enabledSlugs, tenantFieldName, tenantsCollectionSlug, usersSlug, usersTenantsArrayFieldName, usersTenantsArrayTenantFieldName })=>async ({ id, req })=>{
        const idType = getCollectionIDType({
            collectionSlug: tenantsCollectionSlug,
            payload: req.payload
        });
        const currentTenantCookieID = getTenantFromCookie(req.headers, idType);
        if (currentTenantCookieID === id) {
            const newHeaders = new Headers({
                'Set-Cookie': generateCookie({
                    name: 'payload-tenant',
                    expires: new Date(Date.now() - 1000),
                    path: '/',
                    returnCookieAsObject: false,
                    value: ''
                })
            });
            req.responseHeaders = req.responseHeaders ? mergeHeaders(req.responseHeaders, newHeaders) : newHeaders;
        }
        const cleanupPromises = [];
        enabledSlugs.forEach((slug)=>{
            cleanupPromises.push(req.payload.delete({
                collection: slug,
                where: {
                    [tenantFieldName]: {
                        in: [
                            id
                        ]
                    }
                }
            }));
        });
        try {
            const usersWithTenant = await req.payload.find({
                collection: usersSlug,
                depth: 0,
                limit: 0,
                where: {
                    [`${usersTenantsArrayFieldName}.${usersTenantsArrayTenantFieldName}`]: {
                        in: [
                            id
                        ]
                    }
                }
            });
            usersWithTenant?.docs?.forEach((user)=>{
                cleanupPromises.push(req.payload.update({
                    id: user.id,
                    collection: usersSlug,
                    data: {
                        [usersTenantsArrayFieldName]: (user[usersTenantsArrayFieldName] || []).filter((row)=>{
                            if (row[usersTenantsArrayTenantFieldName]) {
                                return row[usersTenantsArrayTenantFieldName] !== id;
                            }
                        })
                    }
                }));
            });
        } catch (e) {
            console.error('Error deleting tenants from users:', e);
        }
        await Promise.all(cleanupPromises);
    };

//# sourceMappingURL=afterTenantDelete.js.map