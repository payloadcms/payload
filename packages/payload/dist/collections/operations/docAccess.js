import { getEntityPermissions } from '../../utilities/getEntityPermissions/getEntityPermissions.js';
import { killTransaction } from '../../utilities/killTransaction.js';
import { sanitizePermissions } from '../../utilities/sanitizePermissions.js';
const allOperations = [
    'create',
    'read',
    'update',
    'delete'
];
export async function docAccessOperation(args) {
    const { id, collection: { config }, data, req } = args;
    const collectionOperations = [
        ...allOperations
    ];
    if (config.auth && typeof config.auth.maxLoginAttempts !== 'undefined' && config.auth.maxLoginAttempts !== 0) {
        collectionOperations.push('unlock');
    }
    if (config.versions) {
        collectionOperations.push('readVersions');
    }
    try {
        const result = await getEntityPermissions({
            id: id,
            blockReferencesPermissions: {},
            data,
            entity: config,
            entityType: 'collection',
            fetchData: id ? true : false,
            operations: collectionOperations,
            req
        });
        const sanitizedPermissions = sanitizePermissions({
            collections: {
                [config.slug]: result
            }
        });
        const collectionPermissions = sanitizedPermissions?.collections?.[config.slug];
        return collectionPermissions ?? {
            fields: {}
        };
    } catch (e) {
        await killTransaction(req);
        throw e;
    }
}

//# sourceMappingURL=docAccess.js.map