import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'title',
  },
  fields: [],
}
