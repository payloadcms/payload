export const PreviewField = ({ descriptionPath, hasGenerateFn = false, overrides, titlePath })=>{
    return {
        name: 'preview',
        type: 'ui',
        admin: {
            components: {
                Field: {
                    clientProps: {
                        descriptionPath,
                        hasGenerateURLFn: hasGenerateFn,
                        titlePath
                    },
                    path: '@payloadcms/plugin-seo/client#PreviewComponent'
                }
            }
        },
        label: 'Preview',
        ...overrides ?? {}
    };
};

//# sourceMappingURL=index.js.map