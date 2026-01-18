export const createVariantOptionsCollection = (props)=>{
    const { access, variantTypesSlug = 'variantTypes' } = props || {};
    const fields = [
        {
            name: 'variantType',
            type: 'relationship',
            admin: {
                readOnly: true
            },
            relationTo: variantTypesSlug,
            required: true
        },
        {
            name: 'label',
            type: 'text',
            required: true
        },
        {
            name: 'value',
            type: 'text',
            admin: {
                description: 'should be defaulted or dynamic based on label'
            },
            required: true
        }
    ];
    const baseConfig = {
        slug: 'variantOptions',
        access: {
            create: access.isAdmin,
            delete: access.isAdmin,
            read: access.publicAccess,
            update: access.isAdmin
        },
        admin: {
            group: false,
            useAsTitle: 'label'
        },
        fields,
        labels: {
            plural: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:variantOptions'),
            singular: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:variantOption')
        },
        trash: true
    };
    return {
        ...baseConfig
    };
};

//# sourceMappingURL=createVariantOptionsCollection.js.map