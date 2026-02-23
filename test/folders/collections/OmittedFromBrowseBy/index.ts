import type { CollectionConfig } from 'payload'

import { createFolderField } from 'payload'

import { folderSlug, omittedFromBrowseBySlug } from '../../shared.js'

export const OmittedFromBrowseBy: CollectionConfig = {
  slug: omittedFromBrowseBySlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    createFolderField({ fieldName: 'folder', relationTo: folderSlug }),
  ],
  labels: {
    plural: 'Omitted From Browse By',
    singular: 'Omitted From Browse By',
  },
}
