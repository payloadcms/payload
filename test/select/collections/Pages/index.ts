import type { CollectionConfig } from 'payload'

import { lexicalEditor, LinkFeature } from '@payloadcms/richtext-lexical'
import { slateEditor } from '@payloadcms/richtext-slate'

// the TSlug generic needs to be passed to defaultPopulate type safety.
export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  // I need only slug, NOT the WHOLE CONTENT!
  defaultPopulate: {
    slug: true,
  },
  fields: [
    {
      name: 'content',
      type: 'blocks',
      blocks: [
        {
          slug: 'cta',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'link',
              type: 'group',
              fields: [
                {
                  name: 'docPoly',
                  type: 'relationship',
                  relationTo: ['pages'],
                },
                {
                  name: 'doc',
                  type: 'relationship',
                  relationTo: 'pages',
                },
                {
                  name: 'docMany',
                  hasMany: true,
                  type: 'relationship',
                  relationTo: 'pages',
                },
                {
                  name: 'docHasManyPoly',
                  type: 'relationship',
                  relationTo: ['pages'],
                  hasMany: true,
                },
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'richTextLexical',
              type: 'richText',
              editor: lexicalEditor({
                features({ defaultFeatures }) {
                  return [...defaultFeatures, LinkFeature({ enabledCollections: ['pages'] })]
                },
              }),
            },
            {
              name: 'richTextSlate',
              type: 'richText',
              editor: slateEditor({}),
            },
          ],
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
    },
  ],
}
