import type { CollectionConfig, Field } from 'payload'

import { articlesSlug, authorsSlug, organizationsSlug } from '../shared.js'

const identityFields: Field[] = [
  { name: 'id', type: 'text' },
  { name: '_branch', type: 'text' },
  { name: '_branchDocID', type: 'text' },
]

export const Articles: CollectionConfig = {
  slug: articlesSlug,
  fields: [
    ...identityFields,
    { name: 'author', type: 'relationship', relationTo: authorsSlug },
    { name: 'coauthor', type: 'relationship', relationTo: authorsSlug },
    { name: 'localizedAuthor', type: 'relationship', relationTo: authorsSlug, localized: true },
  ],
}

export const Authors: CollectionConfig = {
  slug: authorsSlug,
  fields: [
    ...identityFields,
    { name: 'name', type: 'text', localized: true },
    { name: 'code', type: 'text' },
    { name: 'org', type: 'relationship', relationTo: organizationsSlug },
  ],
}

export const Organizations: CollectionConfig = {
  slug: organizationsSlug,
  fields: [...identityFields, { name: 'name', type: 'text', localized: true }],
}
