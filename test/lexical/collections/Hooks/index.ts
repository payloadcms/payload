import type { Block, CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor, LinkFeature } from '@payloadcms/richtext-lexical'

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
        const { value, field, context } = args
        if (!context.hookCalls) {
          context.hookCalls = []
        }
        context.hookCalls.push(`${name}:${field.name}:${value}`)
        return value
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
      hooks,
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
          LinkFeature({
            fields: [
              {
                name: 'linkBlocks',
                type: 'blocks',
                blocks: [RelationshipBlock, TextBlock],
              },
            ],
          }),
        ],
      }),
    },
  ],
}
