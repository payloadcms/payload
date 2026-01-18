export const getTenantOptions = async ({ payload, tenantsArrayFieldName, tenantsArrayTenantFieldName, tenantsCollectionSlug, useAsTitle, user, userHasAccessToAllTenants })=>{
    let tenantOptions = [];
    if (!user) {
        return tenantOptions;
    }
    const isOrderable = payload.collections[tenantsCollectionSlug]?.config?.orderable || false;
    const userTenantIds = !userHasAccessToAllTenants(user) ? (user[tenantsArrayFieldName] || []).map((tenantRow)=>{
        const tenantField = tenantRow[tenantsArrayTenantFieldName];
        if (typeof tenantField === 'string' || typeof tenantField === 'number') {
            return tenantField;
        }
        if (tenantField && typeof tenantField === 'object' && 'id' in tenantField) {
            return tenantField.id;
        }
    }) : undefined;
    const tenants = await payload.find({
        collection: tenantsCollectionSlug,
        depth: 0,
        limit: 0,
        overrideAccess: false,
        select: {
            [useAsTitle]: true,
            ...isOrderable && {
                _order: true
            }
        },
        sort: isOrderable ? '_order' : useAsTitle,
        user,
        ...userTenantIds && {
            where: {
                id: {
                    in: userTenantIds
                }
            }
        }
    });
    tenantOptions = tenants.docs.map((doc)=>({
            label: String(doc[useAsTitle]),
            value: doc.id
        }));
    return tenantOptions;
};

//# sourceMappingURL=getTenantOptions.js.map