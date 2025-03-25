import type { CollectionConfig } from 'payload'

export const orderableJoinSlug = 'orderable-join'

export const OrderableJoinCollection: CollectionConfig = {
  slug: orderableJoinSlug,
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
      name: 'orderableJoinField1',
      type: 'join',
      on: 'orderableField',
      orderable: true,
      collection: 'orderable',
    },
    {
      name: 'orderableJoinField2',
      type: 'join',
      on: 'orderableField',
      orderable: true,
      collection: 'orderable',
    },
    {
      name: 'nonOrderableJoinField',
      type: 'join',
      on: 'orderableField',
      collection: 'orderable',
    },
  ],
}
