import type { User } from '@/payload-types'
import type { CollectionConfig } from 'payload'

import { admins } from '@/access/admins'
import { anyone } from '@/access/anyone'
import { adminsAndUser } from '@/access/adminsAndUser'

export const Addresses: CollectionConfig = {
  slug: 'addresses',
  access: {
    create: adminsAndUser,
    delete: adminsAndUser,
    read: adminsAndUser,
    update: adminsAndUser,
  },
  admin: {
    defaultColumns: ['customer'],
  },
  fields: [
    {
      name: 'customer',
      required: true,
      type: 'relationship',
      relationTo: 'users',
    },
  ],
}
