import type { Where } from 'payload';
import type { UserWithTenantsField } from '../types.js';
type Args = {
    fieldName: string;
    tenantsArrayFieldName?: string;
    tenantsArrayTenantFieldName?: string;
    user: UserWithTenantsField;
};
export declare function getTenantAccess({ fieldName, tenantsArrayFieldName, tenantsArrayTenantFieldName, user, }: Args): Where;
export {};
//# sourceMappingURL=getTenantAccess.d.ts.map