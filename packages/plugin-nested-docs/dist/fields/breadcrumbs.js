export const createBreadcrumbsField = (relationTo, overrides = {})=>({
        name: 'breadcrumbs',
        type: 'array',
        localized: true,
        ...overrides || {},
        admin: {
            readOnly: true,
            ...overrides?.admin || {}
        },
        fields: [
            {
                name: 'doc',
                type: 'relationship',
                admin: {
                    disabled: true
                },
                maxDepth: 0,
                relationTo
            },
            {
                type: 'row',
                fields: [
                    {
                        name: 'url',
                        type: 'text',
                        admin: {
                            width: '50%'
                        },
                        label: 'URL'
                    },
                    {
                        name: 'label',
                        type: 'text',
                        admin: {
                            width: '50%'
                        }
                    }
                ]
            },
            ...overrides?.fields || []
        ]
    });

//# sourceMappingURL=breadcrumbs.js.map