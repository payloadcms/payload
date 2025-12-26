import type { Block, CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { hooksSlug } from '../../slugs.js'

const availableHooks = [
  'beforeValidate',
  'beforeChange',
  'afterChange',
  'afterRead',
  'beforeDuplicate',
] as const

const hooks = Object.fromEntries(
  availableHooks.map((name) => [
    name,
    [
      (args: any) => {
        const { value, field } = args
        console.log(`${name} hook fired:`, field.name, value)
      },
    ],
  ]),
)

const RelationshipBlock: Block = {
  slug: 'relationship-block',
  fields: [
    {
      name: 'relationshipField',
      type: 'relationship',
      relationTo: 'uploads',
      // hooks,
    },
  ],
}

const TextBlock: Block = {
  slug: 'text-block',
  fields: [
    {
      name: 'textInBlock',
      type: 'text',
      hooks,
    },
  ],
}

export const Hooks: CollectionConfig = {
  slug: hooksSlug,

  fields: [
    {
      name: 'title',
      type: 'text',
      // hooks,
    },
    {
      name: 'lexical',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [RelationshipBlock, TextBlock],
          }),
        ],
      }),
    },
  ],
}
