import type { CollectionConfig } from 'payload'

import { orderableJoinSlug } from '../OrderableJoin/index.js'

export const orderableSlug = 'orderable'

export const OrderableCollection: CollectionConfig = {
  slug: orderableSlug,
  access: {
    update: () => ({
      title: {
        not_equals: 'Fixed position',
      },
    }),
  },
  admin: {
    components: {
      beforeList: ['/Seed.tsx#Seed'],
    },
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'orderableField',
      type: 'relationship',
      localized: true,
      relationTo: orderableJoinSlug,
    },
  ],
  orderable: true,
  versions: false,
}
