import type { CollectionConfig } from 'payload'

import { createFolderField, createTagField } from 'payload'

import { foldersSlug, tagsSlug, uploadsSlug } from '../../slugs.js'

const Uploads: CollectionConfig = {
  slug: uploadsSlug,
  admin: {},
  upload: true,
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt Text',
    },
    createFolderField({ relationTo: foldersSlug }),
    createTagField({ relationTo: tagsSlug }),
  ],
  versions: false,
}

export default Uploads
