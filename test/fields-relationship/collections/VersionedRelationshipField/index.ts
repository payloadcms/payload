import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { collection1Slug, versionedRelationshipFieldSlug } from '../../collectionSlugs'

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
