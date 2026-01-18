export const MetaDescriptionField = ({ hasGenerateFn = false, overrides })=>{
    return {
        name: 'description',
        type: 'textarea',
        admin: {
            components: {
                Field: {
                    clientProps: {
                        hasGenerateDescriptionFn: hasGenerateFn
                    },
                    path: '@payloadcms/plugin-seo/client#MetaDescriptionComponent'
                }
            }
        },
        localized: true,
        ...overrides ?? {}
    };
};

//# sourceMappingURL=index.js.map