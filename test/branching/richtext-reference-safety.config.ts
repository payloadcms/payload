import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const richTextMediaDirectory = path.resolve(dirname, 'richtext-reference-media')
export const richTextMediaSlug = 'richtext-reference-media'
export const richTextNumericOtherTargetsSlug = 'richtext-numeric-other-targets'
export const richTextNumericTargetsSlug = 'richtext-numeric-targets'
export const richTextOwnersSlug = 'richtext-reference-owners'
export const richTextRelationshipBlockSlug = 'richtext-relationship-block'
export const richTextTargetsSlug = 'richtext-reference-targets'
export const richTextUploadInlineBlockSlug = 'richtext-upload-inline-block'

export default buildConfigWithDefaults({
  config: {
    branching: true,
    collections: [
      {
        slug: richTextTargetsSlug,
        access: {
          create: ({ data }) => data?.title !== 'blocked merge target',
        },
        fields: [{ name: 'title', type: 'text' }],
        versions: false,
      },
      {
        slug: richTextMediaSlug,
        fields: [{ name: 'alt', type: 'text' }],
        upload: { staticDir: richTextMediaDirectory },
        versions: false,
      },
      {
        slug: richTextNumericTargetsSlug,
        fields: [
          { name: 'id', type: 'number', required: true },
          { name: 'title', type: 'text' },
        ],
        versions: false,
      },
      {
        slug: richTextNumericOtherTargetsSlug,
        fields: [
          { name: 'id', type: 'number', required: true },
          { name: 'title', type: 'text' },
        ],
        versions: false,
      },
      {
        slug: richTextOwnersSlug,
        fields: [
          { name: 'title', type: 'text' },
          {
            name: 'content',
            type: 'richText',
            editor: lexicalEditor({
              features: ({ defaultFeatures }) => [
                ...defaultFeatures,
                BlocksFeature({
                  blocks: [
                    {
                      slug: richTextRelationshipBlockSlug,
                      fields: [
                        {
                          name: 'target',
                          type: 'relationship',
                          relationTo: richTextTargetsSlug,
                        },
                      ],
                    },
                  ],
                  inlineBlocks: [
                    {
                      slug: richTextUploadInlineBlockSlug,
                      fields: [
                        {
                          name: 'media',
                          type: 'upload',
                          relationTo: richTextMediaSlug,
                        },
                      ],
                    },
                  ],
                }),
              ],
            }),
          },
          {
            name: 'target',
            type: 'relationship',
            relationTo: richTextTargetsSlug,
          },
          {
            name: 'layout',
            type: 'blocks',
            blocks: [
              {
                slug: 'numeric-target-link',
                fields: [
                  {
                    name: 'target',
                    type: 'relationship',
                    relationTo: richTextNumericTargetsSlug,
                  },
                ],
              },
              {
                slug: 'numeric-other-target-link',
                fields: [
                  {
                    name: 'target',
                    type: 'relationship',
                    relationTo: richTextNumericOtherTargetsSlug,
                  },
                ],
              },
            ],
          },
        ],
        versions: false,
      },
    ],
  },
  suite: 'branching-richtext-reference-safety',
})
