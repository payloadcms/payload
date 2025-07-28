import { admins } from '@/access/admins'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

export const TransactionsCollection: CollectionOverride = {
  admin: {
    group: 'Ecommerce',
  },
  access: {
    create: admins,
    delete: admins,
    read: admins,
    update: admins,
  },
}
