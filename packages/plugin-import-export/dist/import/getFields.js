export const getFields = (config, options)=>{
    const collectionOptions = options?.collectionSlugs || config.collections?.map(({ slug })=>slug) || [];
    return [
        {
            name: 'collectionSlug',
            type: 'select',
            options: collectionOptions,
            required: true,
            admin: {
                components: {
                    Field: '@payloadcms/plugin-import-export/rsc#ImportCollectionField'
                }
            },
            // @ts-expect-error - this is not correctly typed in plugins right now
            label: ({ t })=>t('plugin-import-export:field-collectionSlug-label'),
            validate: (value)=>{
                if (!value) {
                    return 'Collection is required';
                }
                return true;
            }
        },
        {
            name: 'importMode',
            type: 'select',
            // @ts-expect-error - this is not correctly typed in plugins right now
            label: ({ t })=>t('plugin-import-export:field-importMode-label'),
            options: [
                {
                    // @ts-expect-error - this is not correctly typed in plugins right now
                    label: ({ t })=>t('plugin-import-export:field-importMode-create-label'),
                    value: 'create'
                },
                {
                    // @ts-expect-error - this is not correctly typed in plugins right now
                    label: ({ t })=>t('plugin-import-export:field-importMode-update-label'),
                    value: 'update'
                },
                {
                    // @ts-expect-error - this is not correctly typed in plugins right now
                    label: ({ t })=>t('plugin-import-export:field-importMode-upsert-label'),
                    value: 'upsert'
                }
            ]
        },
        {
            name: 'matchField',
            type: 'text',
            admin: {
                condition: (_, siblingData)=>siblingData?.importMode !== 'create',
                // @ts-expect-error - this is not correctly typed in plugins right now
                description: ({ t })=>t('plugin-import-export:field-matchField-description')
            },
            defaultValue: 'id',
            // @ts-expect-error - this is not correctly typed in plugins right now
            label: ({ t })=>t('plugin-import-export:field-matchField-label')
        },
        {
            name: 'status',
            type: 'select',
            admin: {
                readOnly: true
            },
            defaultValue: 'pending',
            // @ts-expect-error - this is not correctly typed in plugins right now
            label: ({ t })=>t('plugin-import-export:field-status-label'),
            options: [
                {
                    label: 'Pending',
                    value: 'pending'
                },
                {
                    label: 'Completed',
                    value: 'completed'
                },
                {
                    label: 'Partial',
                    value: 'partial'
                },
                {
                    label: 'Failed',
                    value: 'failed'
                }
            ]
        },
        {
            name: 'summary',
            type: 'group',
            admin: {
                condition: (data)=>data?.status === 'completed' || data?.status === 'partial' || data?.status === 'failed'
            },
            fields: [
                {
                    name: 'imported',
                    type: 'number',
                    admin: {
                        readOnly: true
                    },
                    label: 'Imported'
                },
                {
                    name: 'updated',
                    type: 'number',
                    admin: {
                        readOnly: true
                    },
                    label: 'Updated'
                },
                {
                    name: 'total',
                    type: 'number',
                    admin: {
                        readOnly: true
                    },
                    label: 'Total'
                },
                {
                    name: 'issues',
                    type: 'number',
                    admin: {
                        readOnly: true
                    },
                    label: 'Issues'
                },
                {
                    name: 'issueDetails',
                    type: 'json',
                    admin: {
                        condition: (_, siblingData)=>siblingData?.issues > 0,
                        readOnly: true
                    },
                    label: 'Issue Details'
                }
            ],
            // @ts-expect-error - this is not correctly typed in plugins right now
            label: ({ t })=>t('plugin-import-export:field-summary-label')
        },
        {
            name: 'preview',
            type: 'ui',
            admin: {
                components: {
                    Field: '@payloadcms/plugin-import-export/rsc#ImportPreview'
                }
            }
        }
    ];
};

//# sourceMappingURL=getFields.js.map