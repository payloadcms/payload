import { ownerOrAdminCart } from './access'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

export const CartsCollection: CollectionOverride = {
  access: {
    create: () => true, // Allow anyone to create carts
    delete: ownerOrAdminCart(),
    read: ownerOrAdminCart(),
    update: ownerOrAdminCart(),
  },
}
