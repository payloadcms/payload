export const MetaImageField = ({ hasGenerateFn = false, overrides, relationTo })=>{
    const imageField = {
        name: 'image',
        type: 'upload',
        admin: {
            components: {
                Field: {
                    clientProps: {
                        hasGenerateImageFn: hasGenerateFn
                    },
                    path: '@payloadcms/plugin-seo/client#MetaImageComponent'
                }
            },
            description: 'Maximum upload file size: 12MB. Recommended file size for images is <500KB.'
        },
        label: 'Meta Image',
        localized: true,
        relationTo,
        ...overrides ?? {}
    };
    return imageField;
};

//# sourceMappingURL=index.js.map