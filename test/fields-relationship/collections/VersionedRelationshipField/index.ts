import type { CollectionConfig } from 'payload'

import { collection1Slug, versionedRelationshipFieldSlug } from '../../collectionSlugs.js'

export const VersionedRelationshipFieldCollection: CollectionConfig = {
  slug: versionedRelationshipFieldSlug,
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
  ],
  versions: {
    drafts: true,
  },
}
