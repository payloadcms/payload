import type { Payload, TypedUser } from 'payload';
import type { MultiTenantPluginConfig } from '../../types.js';
type Args<ConfigType> = {
    children: React.ReactNode;
    payload: Payload;
    tenantsArrayFieldName: string;
    tenantsArrayTenantFieldName: string;
    tenantsCollectionSlug: string;
    useAsTitle: string;
    user: TypedUser;
    userHasAccessToAllTenants: Required<MultiTenantPluginConfig<ConfigType>>['userHasAccessToAllTenants'];
};
export declare const TenantSelectionProvider: ({ children, payload, tenantsArrayFieldName, tenantsArrayTenantFieldName, tenantsCollectionSlug, useAsTitle, user, userHasAccessToAllTenants, }: Args<any>) => Promise<import("react").JSX.Element>;
export {};
//# sourceMappingURL=index.d.ts.map