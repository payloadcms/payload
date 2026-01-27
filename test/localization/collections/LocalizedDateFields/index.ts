import type { CollectionConfig } from 'payload'

import { localizedDateFieldsSlug } from '../../shared.js'

export const LocalizedDateFields: CollectionConfig = {
  slug: localizedDateFieldsSlug,
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: 'date',
      name: 'localizedDate',
      localized: true,
    },
    {
      type: 'date',
      name: 'date',
    },
  ],
}
