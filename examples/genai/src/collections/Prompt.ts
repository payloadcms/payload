import { CollectionConfig } from 'payload/types'

export const Prompt: CollectionConfig = {
  slug: 'prompt',
  admin: {
    useAsTitle: 'prompt',
  },
  fields: [
    {
      name: 'prompt',
      type: 'text',
      required: true,
    },
    {
      name: 'purpose',
      type: 'select',
      required: true,
      options: [
        {
          label: 'chat',
          value: 'chat',
        },
        {
          label: 'step back',
          value: 'step-back',
        },
        {
          label: 'custom',
          value: 'custom',
        },
      ],
    },
  ],
}
