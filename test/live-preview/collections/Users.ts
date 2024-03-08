import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types.js'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'title',
  },
  fields: [],
}
