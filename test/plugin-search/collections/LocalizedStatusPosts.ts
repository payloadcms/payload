import type { CollectionConfig } from 'payload'

import { localizedStatusPostsSlug } from '../shared.js'

export const LocalizedStatusPosts: CollectionConfig = {
  slug: localizedStatusPostsSlug,
  labels: {
    singular: 'Localized Status Post',
    plural: 'Localized Status Posts',
  },
  admin: {
    useAsTitle: 'title',
  },
  versions: {
    drafts: {
      localizeStatus: true,
    },
  },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
    },
    {
      name: 'excerpt',
      label: 'Excerpt',
      type: 'text',
    },
    {
      type: 'text',
      name: 'slug',
      localized: true,
    },
  ],
}
