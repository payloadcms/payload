import type { CollectionConfig } from 'payload'

import { omittedFromBrowseBySlug } from '../../shared.js'

export const OmittedFromBrowseBy: CollectionConfig = {
  slug: omittedFromBrowseBySlug,
  labels: {
    singular: 'Omitted From Browse By',
    plural: 'Omitted From Browse By',
  },
  admin: {
    useAsTitle: 'title',
  },
  folders: {
    browseByFolder: false,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
