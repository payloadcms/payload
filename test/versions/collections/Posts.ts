import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import { draftSlug, postSlug, versionSlug } from '../shared'

const Posts: CollectionConfig = {
  slug: postSlug,
  fields: [
    {
      name: 'relationToVersions',
      type: 'relationship',
      relationTo: versionSlug,
    },
    {
      name: 'relationToDrafts',
      type: 'relationship',
      relationTo: draftSlug,
    },
  ],
}

export default Posts
