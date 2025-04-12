import type { CollectionConfig } from 'payload'

import { defaultEditorFeatures, lexicalEditor, LinkFeature } from '@payloadcms/richtext-lexical'

import { lexicalAccessControlSlug } from '../../slugs.js'

export const LexicalAccessControl: CollectionConfig = {
  slug: lexicalAccessControlSlug,
  access: {
    read: () => true,
    create: () => false,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: [
          ...defaultEditorFeatures,
          LinkFeature({
            fields: ({ defaultFields }) => [
              ...defaultFields,
              {
                name: 'blocks',
                type: 'blocks',
                blocks: [
                  {
                    slug: 'block',
                    fields: [
                      {
                        name: 'text',
                        type: 'text',
                      },
                    ],
                  },
                ],
              },
            ],
          }),
        ],
      }),
    },
  ],
}
