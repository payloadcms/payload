import type { CollectionConfig } from 'payload/types'

const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'upn',
  },
  access: {
    read: () => true,
  },
  fields: [
    // no fields in this demo necessary
  ],
}

export default Users
