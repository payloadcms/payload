import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types.js'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
}
