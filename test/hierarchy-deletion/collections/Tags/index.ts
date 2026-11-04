import type { CollectionConfig } from 'payload'

import { tagsSlug } from '../../shared.js'

export const Tags: CollectionConfig = {
  slug: tagsSlug,
  access: { create: () => true, delete: () => true, read: () => true, update: () => true },
  admin: { useAsTitle: 'title' },
  fields: [{ name: 'title', type: 'text', required: true }],
  tags: true,
}
