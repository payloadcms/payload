import type { CollectionConfig } from 'payload'

import { versionsSlug } from './Versions.js'

export const categoriesVersionsSlug = 'categories-versions'

export const CategoriesVersions: CollectionConfig = {
  slug: categoriesVersionsSlug,
  fields: [
    {
      name: 'relatedVersions',
      type: 'join',
      collection: versionsSlug,
      on: 'categoryVersion',
    },
    {
      name: 'relatedVersionsMany',
      type: 'join',
      collection: versionsSlug,
      on: 'categoryVersions',
    },
  ],
  versions: {
    drafts: true,
  },
}
