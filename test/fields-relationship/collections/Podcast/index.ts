import type { CollectionConfig } from 'payload'

import { podcastCollectionSlug } from '../../slugs.js'

export const Podcast: CollectionConfig = {
  slug: podcastCollectionSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'id',
      type: 'number',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
    },
  ],
}
