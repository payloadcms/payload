import type { CollectionConfig } from 'payload'

import { localizedQueryReferencesSlug, localizedQueryTargetsSlug } from '../../shared.js'

export const LocalizedQueryTargets: CollectionConfig = {
  slug: localizedQueryTargetsSlug,
  access: {
    read: () => ({ category: { not_equals: 'internal' } }),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'category',
      type: 'text',
    },
  ],
}

export const LocalizedQueryReferences: CollectionConfig = {
  slug: localizedQueryReferencesSlug,
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'target',
      type: 'relationship',
      relationTo: localizedQueryTargetsSlug,
    },
  ],
  versions: {
    drafts: true,
  },
}
