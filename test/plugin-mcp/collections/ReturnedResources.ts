import type { CollectionConfig } from 'payload'

export const ReturnedResources: CollectionConfig = {
  slug: 'returned-resources',
  fields: [
    {
      name: 'uri',
      type: 'text',
      admin: {
        description: 'The URI of the resource',
      },
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
      admin: {
        description: 'The content of the resource',
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
