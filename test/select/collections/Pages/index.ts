import type { CollectionConfig } from 'payload'

import { lexicalEditor, LinkFeature } from '@payloadcms/richtext-lexical'
import { slateEditor } from '@payloadcms/richtext-slate'

// The TSlug generic can be passed to have type safety for `defaultPopulate`.
// If avoided, the `defaultPopulate` type resolves to `SelectType`.
export const Pages: CollectionConfig<'pages'> = {
  slug: 'pages',
  // I need only slug, NOT the WHOLE CONTENT!
  defaultPopulate: {
    slug: true,
    array: {
      title: true,
    },
    blocks: {
      some: {
        title: true,
      },
    },
  },
  access: { read: () => true },
  fields: [
    {
      name: 'relatedPage',
      type: 'relationship',
      relationTo: 'pages',
    },
    {
      name: 'content',
      type: 'blocks',
      blocks: [
        {
          slug: 'introduction',
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
    {
      name: 'additional',
      type: 'text',
    },
    {
      name: 'array',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'other',
          type: 'text',
        },
      ],
    },
    {
      name: 'blocks',
      type: 'blocks',
      blocks: [
        {
          slug: 'some',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'other',
              type: 'text',
            },
          ],
        },
      ],
    },
  ],
}
