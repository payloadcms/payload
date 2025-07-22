import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import { ownerOrAdminAddress } from './access'
import { authenticated } from '@/access/authenticated'
import { beforeChangeAddress } from './beforeChange'

export const Addresses: CollectionOverride = {
  access: {
    create: authenticated,
    delete: ownerOrAdminAddress,
    read: ownerOrAdminAddress,
    update: ownerOrAdminAddress,
  },
  hooks: {
    beforeChange: [beforeChangeAddress],
  },
}
