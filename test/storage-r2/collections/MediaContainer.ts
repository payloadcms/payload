import type { CollectionConfig } from 'payload'

import { mediaClientSlug, mediaContainerSlug } from '../shared.js'

export const MediaContainer: CollectionConfig = {
  slug: mediaContainerSlug,
  fields: [
    {
      name: 'files',
      type: 'upload',
      relationTo: mediaClientSlug,
      hasMany: true,
    },
  ],
  versions: false,
}
