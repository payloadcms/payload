import type { CollectionSlug, ServerProps, ViewTypes } from 'payload';
import type { MultiTenantPluginConfig } from '../../types.js';
type Args = {
    basePath?: string;
    collectionSlug: CollectionSlug;
    docID?: number | string;
    globalSlugs: string[];
    tenantArrayFieldName: string;
    tenantArrayTenantFieldName: string;
    tenantFieldName: string;
    tenantsCollectionSlug: string;
    useAsTitle: string;
    userHasAccessToAllTenants: Required<MultiTenantPluginConfig<any>>['userHasAccessToAllTenants'];
    viewType: ViewTypes;
} & ServerProps;
export declare const GlobalViewRedirect: (args: Args) => Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map