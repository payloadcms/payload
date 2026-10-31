import type { CollectionConfig } from 'payload'

import { postsSlug } from '../shared.js'

export const Posts: CollectionConfig = {
  slug: postsSlug,
  fields: [
    { name: 'tenant', type: 'text', required: true },
    { name: 'slug', type: 'text' },
    { name: 'code', type: 'text' },
    { name: 'gate', type: 'text' },
    { name: 'metadata', type: 'group', fields: [{ name: 'code', type: 'text' }] },
  ],
  indexes: [
    { fields: ['tenant', 'slug'], requireExists: ['slug'], unique: true },
    { fields: ['tenant', 'code'], requireExists: ['gate'], unique: true },
    { fields: ['tenant', 'metadata.code'], requireExists: ['metadata.code'], unique: true },
  ],
}
