import { combineWhereConstraints } from './combineWhereConstraints.js';
import { getTenantAccess } from './getTenantAccess.js';
export const withTenantAccess = ({ accessFunction, accessKey, accessResultCallback, adminUsersSlug, collection, fieldName, tenantsArrayFieldName, tenantsArrayTenantFieldName, userHasAccessToAllTenants })=>async (args)=>{
        const constraints = [];
        const accessFn = typeof accessFunction === 'function' ? accessFunction : ({ req })=>Boolean(req.user);
        const accessResult = await accessFn(args);
        if (accessResult === false) {
            if (accessResultCallback) {
                return accessResultCallback({
                    accessKey,
                    accessResult: false,
                    ...args
                });
            } else {
                return false;
            }
        } else if (accessResult && typeof accessResult === 'object') {
            constraints.push(accessResult);
        }
        if (args.req.user && args.req.user.collection === adminUsersSlug && !userHasAccessToAllTenants(args.req.user)) {
            const tenantConstraint = getTenantAccess({
                fieldName,
                tenantsArrayFieldName,
                tenantsArrayTenantFieldName,
                user: args.req.user
            });
            if (collection.slug === args.req.user.collection) {
                constraints.push({
                    or: [
                        {
                            id: {
                                equals: args.req.user.id
                            }
                        },
                        tenantConstraint
                    ]
                });
            } else {
                constraints.push(tenantConstraint);
            }
            if (accessResultCallback) {
                return accessResultCallback({
                    accessKey,
                    accessResult: combineWhereConstraints(constraints),
                    ...args
                });
            } else {
                return combineWhereConstraints(constraints);
            }
        }
        if (accessResultCallback) {
            return accessResultCallback({
                accessKey,
                accessResult,
                ...args
            });
        } else {
            return accessResult;
        }
    };

//# sourceMappingURL=withTenantAccess.js.map