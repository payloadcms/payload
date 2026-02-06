import type { CollectionConfig } from 'payload'

import { categoriesSlug } from '../Categories/index.js'
import { postsSlug } from '../Posts/index.js'

export const relationshipsSlug = 'relationships'

export const RelationshipsCollection: CollectionConfig = {
  slug: relationshipsSlug,
  admin: {
    useAsTitle: 'title',
    groupBy: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'PolyHasOneRelationship',
      type: 'relationship',
      relationTo: [categoriesSlug, postsSlug],
    },
    {
      name: 'PolyHasManyRelationship',
      type: 'relationship',
      relationTo: [categoriesSlug, postsSlug],
      hasMany: true,
    },
    {
      name: 'MonoHasOneRelationship',
      type: 'relationship',
      relationTo: categoriesSlug,
    },
    {
      name: 'MonoHasManyRelationship',
      type: 'relationship',
      relationTo: categoriesSlug,
      hasMany: true,
    },
  ],
}
