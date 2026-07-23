import type { CollectionConfig } from 'payload'

import { postsSlug } from '../Posts/index.js'

export const pagesSlug = 'pages'

export const Pages: CollectionConfig = {
  slug: pagesSlug,
  admin: {
    useAsTitle: 'title',
  },
  trash: false, // Soft deletes are not enabled for this collection
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: postsSlug,
      hasMany: true,
    },
    {
      name: 'featuredPost',
      type: 'relationship',
      relationTo: postsSlug,
    },
    {
      name: 'featuredItem',
      type: 'relationship',
      relationTo: [postsSlug, pagesSlug],
    },
    {
      name: 'relatedItems',
      type: 'relationship',
      relationTo: [postsSlug, pagesSlug],
      hasMany: true,
    },
    {
      name: 'localizedFeaturedItem',
      type: 'relationship',
      relationTo: [postsSlug, pagesSlug],
      localized: true,
    },
  ],
  versions: {
    drafts: true,
  },
}
