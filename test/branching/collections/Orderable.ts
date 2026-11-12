import type { CollectionConfig } from 'payload'

import { orderableDraftsSlug, orderableJoinSlug, orderableSlug } from '../shared.js'

export const Orderable: CollectionConfig = {
  slug: orderableSlug,
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'parent', type: 'relationship', relationTo: orderableJoinSlug },
  ],
  orderable: true,
  versions: false,
}

export const OrderableDrafts: CollectionConfig = {
  slug: orderableDraftsSlug,
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'parent', type: 'relationship', relationTo: orderableJoinSlug },
  ],
  orderable: true,
  versions: { drafts: true },
}
