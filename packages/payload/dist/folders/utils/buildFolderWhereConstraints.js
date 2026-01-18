import { combineWhereConstraints } from '../../utilities/combineWhereConstraints.js';
import { mergeListSearchAndWhere } from '../../utilities/mergeListSearchAndWhere.js';
export async function buildFolderWhereConstraints({ collectionConfig, folderID, localeCode, req, search = '', sort }) {
    const constraints = [
        mergeListSearchAndWhere({
            collectionConfig,
            search
        })
    ];
    const baseFilterConstraint = await (collectionConfig.admin?.baseFilter ?? collectionConfig.admin?.baseListFilter)?.({
        limit: 0,
        locale: localeCode,
        page: 1,
        req,
        sort: sort || (typeof collectionConfig.defaultSort === 'string' ? collectionConfig.defaultSort : 'id')
    });
    if (baseFilterConstraint) {
        constraints.push(baseFilterConstraint);
    }
    if (folderID) {
        // build folder join where constraints
        constraints.push({
            relationTo: {
                equals: collectionConfig.slug
            }
        });
        // join queries need to omit trashed documents
        if (collectionConfig.trash) {
            constraints.push({
                deletedAt: {
                    exists: false
                }
            });
        }
    }
    const filteredConstraints = constraints.filter(Boolean);
    if (filteredConstraints.length > 1) {
        return combineWhereConstraints(filteredConstraints);
    } else if (filteredConstraints.length === 1) {
        return filteredConstraints[0];
    }
    return undefined;
}

//# sourceMappingURL=buildFolderWhereConstraints.js.map