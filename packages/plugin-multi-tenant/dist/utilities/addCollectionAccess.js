import { withTenantAccess } from './withTenantAccess.js';
export const collectionAccessKeys = [
    'create',
    'read',
    'update',
    'delete',
    'readVersions',
    'unlock'
];
/**
 * Adds tenant access constraint to collection
 * - constrains access a users assigned tenants
 */ export const addCollectionAccess = ({ accessResultCallback, adminUsersSlug, collection, fieldName, tenantsArrayFieldName, tenantsArrayTenantFieldName, userHasAccessToAllTenants })=>{
    collectionAccessKeys.forEach((key)=>{
        if (!collection.access) {
            collection.access = {};
        }
        collection.access[key] = withTenantAccess({
            accessFunction: collection.access?.[key],
            accessKey: key,
            accessResultCallback,
            adminUsersSlug,
            collection,
            fieldName: key === 'readVersions' ? `version.${fieldName}` : fieldName,
            tenantsArrayFieldName,
            tenantsArrayTenantFieldName,
            userHasAccessToAllTenants
        });
    });
};

//# sourceMappingURL=addCollectionAccess.js.map