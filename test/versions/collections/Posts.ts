import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { draftCollectionSlug, postCollectionSlug, versionCollectionSlug } from '../slugs'

const Posts: CollectionConfig = {
  slug: postCollectionSlug,
  fields: [
    {
      name: 'relationToVersions',
      type: 'relationship',
      relationTo: versionCollectionSlug,
    },
    {
      name: 'relationToDrafts',
      type: 'relationship',
      relationTo: draftCollectionSlug,
    },
  ],
}

export default Posts
