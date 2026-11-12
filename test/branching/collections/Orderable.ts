import type { CollectionConfig } from 'payload'

import { orderableDraftsSlug, orderableSlug } from '../shared.js'

export const Orderable: CollectionConfig = {
  slug: orderableSlug,
  admin: { useAsTitle: 'title' },
  fields: [{ name: 'title', type: 'text', required: true }],
  orderable: true,
  versions: false,
}

export const OrderableDrafts: CollectionConfig = {
  slug: orderableDraftsSlug,
  admin: { useAsTitle: 'title' },
  fields: [{ name: 'title', type: 'text', required: true }],
  orderable: true,
  versions: { drafts: true },
}
