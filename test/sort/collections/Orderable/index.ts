import type { CollectionConfig } from 'payload'

import { orderableJoinSlug } from '../OrderableJoin/index.js'

export const orderableSlug = 'orderable'

export const OrderableCollection: CollectionConfig = {
  slug: orderableSlug,
  orderable: true,
  admin: {
    useAsTitle: 'title',
    components: {
      beforeList: ['/Seed.tsx#Seed'],
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'orderableField',
      type: 'relationship',
      relationTo: orderableJoinSlug,
    },
  ],
}
