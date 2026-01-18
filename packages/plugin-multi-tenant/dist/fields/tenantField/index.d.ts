import type { SingleRelationshipField } from 'payload';
import type { RootTenantFieldConfigOverrides } from '../../types.js';
type Args = {
    debug?: boolean;
    isAutosaveEnabled?: boolean;
    name: string;
    overrides?: RootTenantFieldConfigOverrides;
    tenantsArrayFieldName: string;
    tenantsArrayTenantFieldName: string;
    tenantsCollectionSlug: string;
    unique: boolean;
};
export declare const tenantField: ({ name, debug, isAutosaveEnabled, overrides: _overrides, tenantsArrayFieldName, tenantsArrayTenantFieldName, tenantsCollectionSlug, unique, }: Args) => SingleRelationshipField;
export {};
//# sourceMappingURL=index.d.ts.map