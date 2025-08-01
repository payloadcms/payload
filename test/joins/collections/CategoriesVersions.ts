import type { CollectionConfig } from 'payload'

import { categoriesVersionsSlug, versionsSlug } from '../shared.js'

export const CategoriesVersions: CollectionConfig = {
  slug: categoriesVersionsSlug,
  labels: {
    singular: 'Category With Versions',
    plural: 'Categories With Versions',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
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
