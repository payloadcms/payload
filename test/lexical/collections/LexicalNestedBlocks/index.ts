import type { Block, BlockSlug, CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { lexicalNestedBlocksSlug } from '../../slugs.js'

export const NestedBlock: Block = {
  slug: 'nestedBlock',
  fields: [
    {
      name: 'text',
      type: 'text',
    },
  ],
}

export const BlockWithBlockRef: Block = {
  slug: 'blockWithBlockRef',
  fields: [
    {
      name: 'nestedBlocks',
      type: 'blocks',
      blockReferences: ['nestedBlock'],
      blocks: [],
    },
  ],
}

export const LexicalNestedBlocks: CollectionConfig = {
  slug: lexicalNestedBlocksSlug,
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'richText',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: ['blockWithBlockRef' as BlockSlug],
          }),
        ],
      }),
    },
  ],
}
