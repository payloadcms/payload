import { QueryError } from '../../errors/QueryError.js';
import { validOperatorSet } from '../../types/constants.js';
import { validateSearchParam } from './validateSearchParams.js';
export async function validateQueryPaths({ collectionConfig, errors = [], globalConfig, overrideAccess, policies = {
    collections: {},
    globals: {}
}, polymorphicJoin, req, versionFields, where }) {
    const fields = versionFields || (globalConfig || collectionConfig).flattenedFields;
    if (typeof where === 'object') {
        // We need to determine if the whereKey is an AND, OR, or a schema path
        const promises = [];
        for(const path in where){
            const constraint = where[path];
            if ((path === 'and' || path === 'or') && Array.isArray(constraint)) {
                for (const item of constraint){
                    if (collectionConfig) {
                        promises.push(validateQueryPaths({
                            collectionConfig,
                            errors,
                            overrideAccess,
                            policies,
                            polymorphicJoin,
                            req,
                            versionFields,
                            where: item
                        }));
                    } else {
                        promises.push(validateQueryPaths({
                            errors,
                            globalConfig,
                            overrideAccess,
                            policies,
                            polymorphicJoin,
                            req,
                            versionFields,
                            where: item
                        }));
                    }
                }
            } else if (!Array.isArray(constraint)) {
                for(const operator in constraint){
                    const val = constraint[operator];
                    if (validOperatorSet.has(operator)) {
                        promises.push(validateSearchParam({
                            collectionConfig,
                            constraint: where,
                            errors,
                            fields,
                            globalConfig,
                            operator,
                            overrideAccess,
                            path,
                            policies,
                            polymorphicJoin,
                            req,
                            val,
                            versionFields
                        }));
                    }
                }
            }
        }
        await Promise.all(promises);
        if (errors.length > 0) {
            throw new QueryError(errors);
        }
    }
}

//# sourceMappingURL=validateQueryPaths.js.map