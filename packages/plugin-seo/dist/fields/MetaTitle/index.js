export const MetaTitleField = ({ hasGenerateFn = false, overrides })=>{
    return {
        name: 'title',
        type: 'text',
        admin: {
            components: {
                Field: {
                    clientProps: {
                        hasGenerateTitleFn: hasGenerateFn
                    },
                    path: '@payloadcms/plugin-seo/client#MetaTitleComponent'
                }
            }
        },
        localized: true,
        ...overrides ?? {}
    };
};

//# sourceMappingURL=index.js.map