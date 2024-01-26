import { CollectionConfig } from 'payload/types'

export const Resource: CollectionConfig = {
  slug: 'resource',
  admin: {
    useAsTitle: 'resource',
  },
  fields: [
    {
      name: 'resource',
      type: 'text',
      required: true,
    },
    // WIP: Encrypt / Decrypt
    {
      name: 'key',
      type: 'textarea',
    },
  ],
}
