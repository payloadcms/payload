import { defaults } from '../../defaults.js';
export const tenantsArrayField = ({ arrayFieldAccess, rowFields, tenantFieldAccess, tenantsArrayFieldName = defaults.tenantsArrayFieldName, tenantsArrayTenantFieldName = defaults.tenantsArrayTenantFieldName, tenantsCollectionSlug = defaults.tenantCollectionSlug })=>({
        name: tenantsArrayFieldName,
        type: 'array',
        access: arrayFieldAccess,
        fields: [
            {
                name: tenantsArrayTenantFieldName,
                type: 'relationship',
                access: tenantFieldAccess,
                index: true,
                relationTo: tenantsCollectionSlug,
                required: true,
                saveToJWT: true
            },
            ...rowFields || []
        ],
        saveToJWT: true
    });

//# sourceMappingURL=index.js.map