export const OverviewField = ({ descriptionOverrides, descriptionPath, imagePath, overrides, titleOverrides, titlePath })=>{
    return {
        name: 'overview',
        type: 'ui',
        admin: {
            components: {
                Field: {
                    clientProps: {
                        descriptionOverrides,
                        descriptionPath,
                        imagePath,
                        titleOverrides,
                        titlePath
                    },
                    path: '@payloadcms/plugin-seo/client#OverviewComponent'
                }
            }
        },
        label: 'Overview',
        ...overrides ?? {}
    };
};

//# sourceMappingURL=index.js.map