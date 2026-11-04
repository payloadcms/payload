import type { CollectionConfig } from 'payload'

import { versionsDisabledCollectionSlug } from '../slugs.js'

export const VersionsDisabledCollection: CollectionConfig = {
  slug: versionsDisabledCollectionSlug,
  access: {
    readVersions: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: false,
}
