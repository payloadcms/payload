import type { CollectionConfig } from 'payload'

export const Rolls: CollectionConfig = {
  slug: 'rolls',
  fields: [
    {
      name: 'sides',
      type: 'number',
      admin: {
        description: 'The number of sides on the die that was rolled',
      },
      required: true,
    },
    {
      name: 'result',
      type: 'number',
      admin: {
        description: 'The result of the die roll',
      },
      required: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'The user who rolled the die',
      },
      required: true,
    },
  ],
}
