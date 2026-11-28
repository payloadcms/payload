import type { CollectionConfig } from 'payload'

import { fields } from '../fields.js'
import { collectionSlug } from '../shared.js'

export const RetentionPosts: CollectionConfig = {
  slug: collectionSlug,
  access: {
    create: () => true,
    delete: () => true,
    read: () => true,
    readVersions: () => true,
    update: () => true,
  },
  fields,
  versions: { drafts: true, maxPerDoc: 2 },
}
