export const createVariantTypesCollection = (props)=>{
    const { access, variantOptionsSlug = 'variantOptions' } = props || {};
    const fields = [
        {
            name: 'label',
            type: 'text',
            required: true
        },
        {
            name: 'name',
            type: 'text',
            required: true
        },
        {
            name: 'options',
            type: 'join',
            collection: variantOptionsSlug,
            maxDepth: 2,
            on: 'variantType',
            orderable: true
        }
    ];
    const baseConfig = {
        slug: 'variantTypes',
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
                t('plugin-ecommerce:variantTypes'),
            singular: ({ t })=>// @ts-expect-error - translations are not typed in plugins yet
                t('plugin-ecommerce:variantType')
        },
        trash: true
    };
    return {
        ...baseConfig
    };
};

//# sourceMappingURL=createVariantTypesCollection.js.map