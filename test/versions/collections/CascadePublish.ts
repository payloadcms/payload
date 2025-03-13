import type { CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor, LinkFeature } from '@payloadcms/richtext-lexical'
import { slateEditor } from '@payloadcms/richtext-slate'

import { cascadePublishSlug } from '../slugs.js'

export const CascadePublish: CollectionConfig = {
  slug: cascadePublishSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'relation',
      type: 'relationship',
      relationTo: 'cascade-publish-relations',
    },
    {
      name: 'lexical',
      type: 'richText',
      editor: lexicalEditor({
        features({ defaultFeatures }) {
          return [
            ...defaultFeatures,
            LinkFeature({ enabledCollections: ['cascade-publish-relations'] }),
            BlocksFeature({
              blocks: [
                {
                  slug: 'someBlock',
                  fields: [
                    {
                      type: 'relationship',
                      relationTo: 'cascade-publish-relations',
                      name: 'relation',
                    },
                  ],
                },
              ],
            }),
          ]
        },
      }),
    },
    {
      name: 'slate',
      type: 'richText',
      editor: slateEditor({}),
    },
  ],
  versions: {
    drafts: { cascadePublish: true },
  },
}
