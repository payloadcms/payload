import type { CollectionConfig } from 'payload'

import { draftWithImmutableFieldCollectionSlug } from '../slugs.js'

const DraftsWithImmutableField: CollectionConfig = {
  slug: draftWithImmutableFieldCollectionSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'immutable',
      type: 'text',
      access: {
        update: () => false,
      },
      required: true,
    },
    {
      name: 'restoreGated',
      type: 'text',
      access: {
        restoreVersion: () => false,
        update: () => true,
      },
    },
  ],
  versions: {
    drafts: true,
  },
}

export default DraftsWithImmutableField
