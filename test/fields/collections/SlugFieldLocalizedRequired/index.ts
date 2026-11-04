import type { CollectionConfig } from 'payload'

import { slugLocalizedRequiredSlug } from '../../slugs.js'

export const SlugFieldLocalizedRequired: CollectionConfig = {
  slug: slugLocalizedRequiredSlug,
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'slug', type: 'slug', localized: true, useAsSlug: 'title' },
  ],
  versions: false,
}
