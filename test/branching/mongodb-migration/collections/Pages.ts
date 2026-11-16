import type { CollectionConfig } from 'payload'

import { pagesSlug } from '../shared.js'

// This adapter-layer fixture supplies the schema produced by the later collection-write layer.
export const Pages: CollectionConfig = {
  slug: pagesSlug,
  fields: [
    { name: '_branch', type: 'text' },
    { name: 'slug', type: 'text' },
    { name: 'externalID', type: 'text' },
    { name: 'title', type: 'text' },
    { name: 'localizedSlug', type: 'text', localized: true },
    { name: 'code', type: 'text', localized: true },
    { name: 'region', type: 'text' },
  ],
  indexes: [
    { fields: ['slug', '_branch'], unique: true, requireExists: ['slug'] },
    { fields: ['localizedSlug', '_branch'], unique: true, requireExists: ['localizedSlug'] },
    { fields: ['code', 'region', '_branch'], unique: true },
  ],
  versions: true,
}
