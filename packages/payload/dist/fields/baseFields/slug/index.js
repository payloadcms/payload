import { generateSlug } from './generateSlug.js';
/**
 * A slug is a unique, indexed, URL-friendly string that identifies a particular document, often used to construct the URL of a webpage.
 * The `slug` field auto-generates its value based on another field, e.g. "My Title" → "my-title".
 *
 * The slug should continue to be generated through:
 * 1. The `create` operation, unless the user has modified the slug manually
 * 2. The `update` operation, if:
 *   a. Autosave is _not_ enabled and there is no slug
 *   b. Autosave _is_ enabled, the doc is unpublished, and the user has not modified the slug manually
 *
 * The slug should stabilize after all above criteria have been met, because the URL is typically derived from the slug.
 * This is to protect modifying potentially live URLs, breaking links, etc. without explicit intent.
 *
 * @experimental This field is experimental and may change or be removed in the future. Use at your own risk.
 */ export const slugField = ({ name: slugFieldName = 'slug', checkboxName = 'generateSlug', fieldToUse, localized, overrides, position = 'sidebar', required = true, slugify, useAsSlug: useAsSlugFromArgs = 'title' } = {})=>{
    const useAsSlug = fieldToUse || useAsSlugFromArgs;
    const baseField = {
        type: 'row',
        admin: {
            position
        },
        fields: [
            {
                name: checkboxName,
                type: 'checkbox',
                admin: {
                    description: 'When enabled, the slug will auto-generate from the title field on save and autosave.',
                    disableBulkEdit: true,
                    disableGroupBy: true,
                    disableListColumn: true,
                    disableListFilter: true,
                    hidden: true
                },
                defaultValue: true,
                hooks: {
                    beforeChange: [
                        generateSlug({
                            slugFieldName,
                            slugify,
                            useAsSlug
                        })
                    ]
                },
                localized
            },
            {
                name: slugFieldName,
                type: 'text',
                admin: {
                    components: {
                        Field: {
                            clientProps: {
                                useAsSlug
                            },
                            path: '@payloadcms/ui#SlugField'
                        }
                    },
                    width: '100%'
                },
                custom: {
                    /**
           * This is needed so we can access it from the `slugifyHandler` server function.
           */ slugify
                },
                index: true,
                localized,
                required,
                unique: true
            }
        ]
    };
    if (typeof overrides === 'function') {
        return overrides(baseField);
    }
    return baseField;
};

//# sourceMappingURL=index.js.map