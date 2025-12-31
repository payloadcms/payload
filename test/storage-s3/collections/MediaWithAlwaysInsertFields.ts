import type { CollectionConfig } from 'payload'

import { mediaWithAlwaysInsertFieldsSlug } from '../shared.js'

export const MediaWithAlwaysInsertFields: CollectionConfig = {
  slug: mediaWithAlwaysInsertFieldsSlug,
  upload: true,
  fields: [
    {
      name: 'alt',
      label: 'Alt Text',
      type: 'text',
    },
  ],
}
