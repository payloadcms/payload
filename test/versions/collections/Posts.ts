import type { CollectionConfig } from 'payload'

import {
  autosaveCollectionSlug,
  draftCollectionSlug,
  postCollectionSlug,
  versionCollectionSlug,
} from '../slugs.js'

const Posts: CollectionConfig = {
  slug: postCollectionSlug,
  fields: [
    {
      name: 'relationship',
      label: 'Relationship',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'relationToAutosaves',
      type: 'relationship',
      relationTo: autosaveCollectionSlug,
    },
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
