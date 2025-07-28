import type { Block } from 'payload'

export const ReusableContent: Block = {
  slug: 'reusableContentBlock',
  fields: [
    {
      name: 'reusableContentBlockFields',
      type: 'group',
      fields: [
        {
          name: 'reusableContent',
          type: 'relationship',
          relationTo: 'reusable-content',
          required: true,
        },
        {
          name: 'customId',
          type: 'text',
          admin: {
            description: 'Custom ID for targeting with CSS/JS',
          },
        },
      ],
    },
  ],
}
