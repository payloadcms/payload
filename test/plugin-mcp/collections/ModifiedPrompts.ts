import type { CollectionConfig } from 'payload'

export const ModifiedPrompts: CollectionConfig = {
  slug: 'modified-prompts',
  fields: [
    {
      name: 'original',
      type: 'textarea',
      admin: {
        description: 'The original prompt',
      },
      required: true,
    },
    {
      name: 'modified',
      type: 'textarea',
      admin: {
        description: 'The modified prompt',
      },
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'The user sent the prompt to modify',
      },
      required: true,
    },
  ],
}
