import type { CollectionConfig } from 'payload'

export const pagesSlug = 'pages'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  admin: {
    useAsTitle: 'title',
    // Required for the *default* LinkFeature (no enabledCollections/disabledCollections)
    // to offer this collection as an internal link target — see
    // packages/richtext-lexical/src/features/link/server/baseFields.ts.
    enableRichTextLink: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
  versions: false,
}
