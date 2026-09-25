import type { CollectionConfig } from 'payload'

import { collection1Slug, versionedRelationshipFieldSlug } from '../../slugs.js'

export const Versions: CollectionConfig = {
  slug: versionedRelationshipFieldSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'relationshipField',
      type: 'relationship',
      relationTo: [collection1Slug],
      hasMany: true,
    },
    {
      name: 'relatedVersionedDoc',
      type: 'relationship',
      relationTo: versionedRelationshipFieldSlug,
    },
  ],
  versions: {
    drafts: true,
  },
}
