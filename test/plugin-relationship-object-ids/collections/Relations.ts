import type { CollectionConfig } from 'payload/types'

import { pagesSlug, postsSlug, relationsSlug, uploadsSlug } from '../shared.js'

export const Relations: CollectionConfig = {
  slug: relationsSlug,
  fields: [
    {
      name: 'hasOne',
      type: 'relationship',
      relationTo: postsSlug,
    },
    {
      name: 'hasOnePoly',
      type: 'relationship',
      relationTo: [pagesSlug, postsSlug],
    },
    {
      name: 'hasMany',
      type: 'relationship',
      relationTo: postsSlug,
      hasMany: true,
    },
    {
      name: 'hasManyPoly',
      type: 'relationship',
      relationTo: [pagesSlug, postsSlug],
      hasMany: true,
    },
    {
      name: 'upload',
      type: 'upload',
      relationTo: uploadsSlug,
    },
  ],
}
