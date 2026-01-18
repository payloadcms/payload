import type { PayloadRequest, Where } from 'payload';
import type { MultiTenantPluginConfig } from '../types.js';
type Args<ConfigType = unknown> = {
    /**
     * If the document this filter is run belongs to a tenant, the tenant ID should be passed here.
     * If set, this will be used instead of the tenant cookie
     */
    docTenantID?: number | string;
    filterFieldName: string;
    req: PayloadRequest;
    tenantsArrayFieldName?: string;
    tenantsArrayTenantFieldName?: string;
    tenantsCollectionSlug: string;
    userHasAccessToAllTenants: Required<MultiTenantPluginConfig<ConfigType>>['userHasAccessToAllTenants'];
};
export declare const filterDocumentsByTenants: <ConfigType = unknown>({ docTenantID, filterFieldName, req, tenantsArrayFieldName, tenantsArrayTenantFieldName, tenantsCollectionSlug, userHasAccessToAllTenants, }: Args<ConfigType>) => null | Where;
export {};
//# sourceMappingURL=filterDocumentsByTenants.d.ts.map