import { CollectionConfig } from 'payload/types'

export const Transformer: CollectionConfig = {
  slug: 'transformer',
  admin: {
    useAsTitle: 'service',
  },
  fields: [
    {
      name: 'service',
      type: 'select',
      required: true,
      options: [
        {
          label: 'custom',
          value: 'custom',
        },
        {
          label: 'OpenAI',
          value: 'openai',
        },
      ],
    },
    {
      name: 'resource',
      type: 'relationship',
      relationTo: 'resource',
    },
  ],
}
