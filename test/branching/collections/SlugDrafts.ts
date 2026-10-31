import type { CollectionConfig } from 'payload'

import { slugDraftsSlug } from '../shared.js'

export const SlugDrafts: CollectionConfig = {
  slug: slugDraftsSlug,
  admin: { useAsTitle: 'title' },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'slug', type: 'slug', useAsSlug: 'title' },
    { name: 'code', type: 'text', unique: true },
  ],
  versions: { drafts: { autosave: { interval: 100 } } },
}
