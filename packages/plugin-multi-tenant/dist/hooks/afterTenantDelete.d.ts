import type { CollectionAfterDeleteHook, CollectionConfig } from 'payload';
type Args = {
    collection: CollectionConfig;
    enabledSlugs: string[];
    tenantFieldName: string;
    tenantsCollectionSlug: string;
    usersSlug: string;
    usersTenantsArrayFieldName: string;
    usersTenantsArrayTenantFieldName: string;
};
/**
 * Add cleanup logic when tenant is deleted
 * - delete documents related to tenant
 * - remove tenant from users
 */
export declare const addTenantCleanup: ({ collection, enabledSlugs, tenantFieldName, tenantsCollectionSlug, usersSlug, usersTenantsArrayFieldName, usersTenantsArrayTenantFieldName, }: Args) => void;
export declare const afterTenantDelete: ({ enabledSlugs, tenantFieldName, tenantsCollectionSlug, usersSlug, usersTenantsArrayFieldName, usersTenantsArrayTenantFieldName, }: Omit<Args, "collection">) => CollectionAfterDeleteHook;
export {};
//# sourceMappingURL=afterTenantDelete.d.ts.map