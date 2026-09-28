import { FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { type CollectionConfig, createFolderField } from 'payload'

export const pagesSlug = 'pages'

export const PagesCollection: CollectionConfig = {
  slug: pagesSlug,
  admin: {
    group: 'Content',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
      }),
    },
    createFolderField({
      relationTo: 'folders',
    }),
  ],
  versions: {
    drafts: true,
  },
  // versions: false,
}
