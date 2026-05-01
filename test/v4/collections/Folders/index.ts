import type { CollectionConfig } from 'payload'

import { foldersSlug } from '../../slugs.js'

const Folders: CollectionConfig = {
  slug: foldersSlug,
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
  hierarchy: {
    parentFieldName: 'parent',
  },
}

export default Folders
