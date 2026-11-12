import type { CollectionConfig } from 'payload'

import { orderableDraftsSlug, orderableJoinSlug, orderableSlug } from '../shared.js'

export const OrderableJoin: CollectionConfig = {
  slug: orderableJoinSlug,
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'items', type: 'join', collection: orderableSlug, on: 'parent', orderable: true },
    {
      name: 'draftItems',
      type: 'join',
      collection: orderableDraftsSlug,
      on: 'parent',
      orderable: true,
    },
  ],
  versions: false,
}
