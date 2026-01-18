import type { Endpoint } from 'payload';
import type { MultiTenantPluginConfig } from '../types.js';
export declare const getTenantOptionsEndpoint: <ConfigType>({ tenantsArrayFieldName, tenantsArrayTenantFieldName, tenantsCollectionSlug, useAsTitle, userHasAccessToAllTenants, }: {
    tenantsArrayFieldName: string;
    tenantsArrayTenantFieldName: string;
    tenantsCollectionSlug: string;
    useAsTitle: string;
    userHasAccessToAllTenants: Required<MultiTenantPluginConfig<ConfigType>>["userHasAccessToAllTenants"];
}) => Endpoint;
//# sourceMappingURL=getTenantOptionsEndpoint.d.ts.map