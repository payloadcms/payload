import { admins } from '@/access/admins'
import { ownerOrAdminOrder } from './access'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

export const OrdersCollection: CollectionOverride = {
  access: {
    create: admins,
    delete: ownerOrAdminOrder(),
    read: ownerOrAdminOrder(),
    update: ownerOrAdminOrder(),
  },
}
