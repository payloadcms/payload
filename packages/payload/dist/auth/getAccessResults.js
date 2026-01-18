import { getEntityPermissions } from '../utilities/getEntityPermissions/getEntityPermissions.js';
import { sanitizePermissions } from '../utilities/sanitizePermissions.js';
export async function getAccessResults({ req }) {
    const results = {
        collections: {},
        globals: {}
    };
    const { payload, user } = req;
    const isLoggedIn = !!user;
    const userCollectionConfig = user && user.collection ? payload?.collections?.[user.collection]?.config : null;
    if (userCollectionConfig && payload.config.admin.user === user?.collection) {
        results.canAccessAdmin = userCollectionConfig.access.admin ? await userCollectionConfig.access.admin({
            req
        }) : isLoggedIn;
    } else {
        results.canAccessAdmin = false;
    }
    const blockReferencesPermissions = {};
    await Promise.all(payload.config.collections.map(async (collection)=>{
        const collectionOperations = [
            'create',
            'read',
            'update',
            'delete'
        ];
        if (collection.auth && typeof collection.auth.maxLoginAttempts !== 'undefined' && collection.auth.maxLoginAttempts !== 0) {
            collectionOperations.push('unlock');
        }
        if (collection.versions) {
            collectionOperations.push('readVersions');
        }
        const collectionPermissions = await getEntityPermissions({
            blockReferencesPermissions,
            entity: collection,
            entityType: 'collection',
            fetchData: false,
            operations: collectionOperations,
            req
        });
        results.collections[collection.slug] = collectionPermissions;
    }));
    await Promise.all(payload.config.globals.map(async (global)=>{
        const globalOperations = [
            'read',
            'update'
        ];
        if (global.versions) {
            globalOperations.push('readVersions');
        }
        const globalPermissions = await getEntityPermissions({
            blockReferencesPermissions,
            entity: global,
            entityType: 'global',
            fetchData: false,
            operations: globalOperations,
            req
        });
        results.globals[global.slug] = globalPermissions;
    }));
    return sanitizePermissions(results);
}

//# sourceMappingURL=getAccessResults.js.map