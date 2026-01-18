import type { Access, AccessArgs, AccessResult, CollectionConfig } from 'payload';
import type { AllAccessKeys, MultiTenantPluginConfig } from '../types.js';
type Args<ConfigType> = {
    accessFunction?: Access;
    accessKey: AllAccessKeys[number];
    accessResultCallback?: MultiTenantPluginConfig<ConfigType>['usersAccessResultOverride'];
    adminUsersSlug: string;
    collection: CollectionConfig;
    fieldName: string;
    tenantsArrayFieldName?: string;
    tenantsArrayTenantFieldName?: string;
    userHasAccessToAllTenants: Required<MultiTenantPluginConfig<ConfigType>>['userHasAccessToAllTenants'];
};
export declare const withTenantAccess: <ConfigType>({ accessFunction, accessKey, accessResultCallback, adminUsersSlug, collection, fieldName, tenantsArrayFieldName, tenantsArrayTenantFieldName, userHasAccessToAllTenants, }: Args<ConfigType>) => (args: AccessArgs) => Promise<AccessResult>;
export {};
//# sourceMappingURL=withTenantAccess.d.ts.map