import type { Block, CollectionConfig } from 'payload'

import { BlocksFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

import { nestedHooksSlug } from '../../slugs.js'

const hooks = {
  beforeValidate: (value: any) => {
    console.log('beforeValidate hook fired:', value)
    return value
  },
  beforeChange: (value: any) => {
    console.log('beforeChange hook fired:', value)
    return value
  },
  afterChange: (value: any) => {
    console.log('afterChange hook fired:', value)
    return value
  },
  afterRead: (value: any) => {
    console.log('afterRead hook fired:', value)
    return value
  },
  beforeDuplicate: (value: any) => {
    console.log('beforeDuplicate hook fired:', value)
    return value
  },
}

const RelationshipBlock: Block = {
  slug: 'relationship-block',
  fields: [
    {
      name: 'relationshipField',
      type: 'relationship',
      relationTo: 'uploads',
      hooks: {
        beforeValidate: [({ value }) => hooks.beforeValidate(value)],
        beforeChange: [({ value }) => hooks.beforeChange(value)],
        afterChange: [({ value }) => hooks.afterChange(value)],
        afterRead: [({ value }) => hooks.afterRead(value)],
        beforeDuplicate: [({ value }) => hooks.beforeDuplicate(value)],
      },
    },
  ],
}

export const NestedHooks: CollectionConfig = {
  slug: nestedHooksSlug,

  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [
          ...defaultFeatures,
          BlocksFeature({
            blocks: [RelationshipBlock],
          }),
        ],
      }),
    },
  ],
}
