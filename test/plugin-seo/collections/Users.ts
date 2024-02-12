import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      label: 'Custom Email',
    },
  ],
}
