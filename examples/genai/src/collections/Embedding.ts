import { CollectionConfig } from 'payload/types'

export const Embedding: CollectionConfig = {
  slug: 'embedding',
  admin: {
    useAsTitle: 'value',
  },
  fields: [
    {
      name: 'source',
      type: 'array',
      fields: [
        {
          name: 'prompt',
          type: 'relationship',
          relationTo: 'prompt',
        },
        {
          name: 'media',
          type: 'relationship',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'transformer',
      type: 'relationship',
      relationTo: 'transformer',
    },
    {
      name: 'value',
      type: 'text',
      required: true,
    },
  ],
}
