import type { User } from '@/payload-types'
import type { CollectionConfig } from 'payload'

import { admins } from '@/access/admins'
import { anyone } from '@/access/anyone'
import { adminsAndUser } from '@/access/adminsAndUser'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

export const Addresses: CollectionOverride = {
  access: {
    create: adminsAndUser,
    delete: adminsAndUser,
    read: adminsAndUser,
    update: adminsAndUser,
  },
}
