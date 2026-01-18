import { getEntityPermissions } from '../../utilities/getEntityPermissions/getEntityPermissions.js';
import { killTransaction } from '../../utilities/killTransaction.js';
import { sanitizePermissions } from '../../utilities/sanitizePermissions.js';
export const docAccessOperation = async (args)=>{
    const { data, globalConfig, req } = args;
    const globalOperations = [
        'read',
        'update'
    ];
    if (globalConfig.versions) {
        globalOperations.push('readVersions');
    }
    try {
        const result = await getEntityPermissions({
            id: undefined,
            blockReferencesPermissions: {},
            data,
            entity: globalConfig,
            entityType: 'global',
            fetchData: true,
            operations: globalOperations,
            req
        });
        const sanitizedPermissions = sanitizePermissions({
            globals: {
                [globalConfig.slug]: result
            }
        });
        const globalPermissions = sanitizedPermissions?.globals?.[globalConfig.slug];
        return globalPermissions ?? {
            fields: {}
        };
    } catch (e) {
        await killTransaction(req);
        throw e;
    }
};

//# sourceMappingURL=docAccess.js.map