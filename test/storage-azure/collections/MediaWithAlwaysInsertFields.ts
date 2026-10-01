import type { CollectionConfig } from 'payload'

import { mediaWithAlwaysInsertFieldsSlug } from '../shared.js'

export const MediaWithAlwaysInsertFields: CollectionConfig = {
  slug: mediaWithAlwaysInsertFieldsSlug,
  upload: {
    disableLocalStorage: false,
  },
  fields: [],
  versions: false,
}
