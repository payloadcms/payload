import type { Payload, TypedUser, ViewTypes } from 'payload';
import type { MultiTenantPluginConfig } from '../types.js';
type Args = {
    /**
     * This is no longer needed and is handled internally.
     *
     * @deprecated
     */
    basePath?: string;
    docID?: number | string;
    headers: Headers;
    payload: Payload;
    slug: string;
    tenantFieldName: string;
    tenantsArrayFieldName: string;
    tenantsArrayTenantFieldName: string;
    tenantsCollectionSlug: string;
    useAsTitle: string;
    user?: TypedUser;
    userHasAccessToAllTenants: Required<MultiTenantPluginConfig<any>>['userHasAccessToAllTenants'];
    view: ViewTypes;
};
export declare function getGlobalViewRedirect({ slug: collectionSlug, docID, headers, payload, tenantFieldName, tenantsArrayFieldName, tenantsArrayTenantFieldName, tenantsCollectionSlug, useAsTitle, user, userHasAccessToAllTenants, view, }: Args): Promise<string | void>;
export {};
//# sourceMappingURL=getGlobalViewRedirect.d.ts.map