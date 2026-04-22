import type { CollectionConfig } from 'payload'

import { mediaWithCompositePrefixesSlug } from '../shared.js'

export const MediaWithCompositePrefixes: CollectionConfig = {
  slug: mediaWithCompositePrefixesSlug,
  fields: [],
  upload: {
    disableLocalStorage: false,
    filenameCompoundIndex: ['filename', 'prefix'],
  },
}
