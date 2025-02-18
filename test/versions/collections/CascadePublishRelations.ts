import type { CollectionConfig } from 'payload'

import { cascadePublishRelationsSlug } from '../slugs.js'

export const CascadePublishRelations: CollectionConfig = {
  slug: cascadePublishRelationsSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: {
    drafts: { cascadePublish: true },
  },
}
