import type { OptionObject, Payload, TypedUser } from 'payload';
import type { MultiTenantPluginConfig } from '../types.js';
export declare const getTenantOptions: ({ payload, tenantsArrayFieldName, tenantsArrayTenantFieldName, tenantsCollectionSlug, useAsTitle, user, userHasAccessToAllTenants, }: {
    payload: Payload;
    tenantsArrayFieldName: string;
    tenantsArrayTenantFieldName: string;
    tenantsCollectionSlug: string;
    useAsTitle: string;
    user: TypedUser;
    userHasAccessToAllTenants: Required<MultiTenantPluginConfig<any>>["userHasAccessToAllTenants"];
}) => Promise<OptionObject[]>;
//# sourceMappingURL=getTenantOptions.d.ts.map