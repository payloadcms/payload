import type { CollectionConfig } from 'payload';
import type { AllAccessKeys, MultiTenantPluginConfig } from '../types.js';
export declare const collectionAccessKeys: AllAccessKeys;
type Args<ConfigType> = {
    accessResultCallback?: MultiTenantPluginConfig<ConfigType>['usersAccessResultOverride'];
    adminUsersSlug: string;
    collection: CollectionConfig;
    fieldName: string;
    tenantsArrayFieldName?: string;
    tenantsArrayTenantFieldName?: string;
    userHasAccessToAllTenants: Required<MultiTenantPluginConfig<ConfigType>>['userHasAccessToAllTenants'];
};
/**
 * Adds tenant access constraint to collection
 * - constrains access a users assigned tenants
 */
export declare const addCollectionAccess: <ConfigType>({ accessResultCallback, adminUsersSlug, collection, fieldName, tenantsArrayFieldName, tenantsArrayTenantFieldName, userHasAccessToAllTenants, }: Args<ConfigType>) => void;
export {};
//# sourceMappingURL=addCollectionAccess.d.ts.map