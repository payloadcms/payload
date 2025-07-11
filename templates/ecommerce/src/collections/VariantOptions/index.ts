import { admins } from '@/access/admins'
import { anyone } from '@/access/anyone'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

export const VariantOptionsCollection: CollectionOverride = {
  access: {
    create: admins,
    update: admins,
    delete: admins,
    read: anyone,
  },
}
