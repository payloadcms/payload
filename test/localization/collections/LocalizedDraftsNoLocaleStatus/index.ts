import type { CollectionConfig } from 'payload'

import { localizedDraftsNoLocaleStatusSlug } from '../../shared.js'

export const LocalizedDraftsNoLocaleStatus: CollectionConfig = {
  slug: localizedDraftsNoLocaleStatusSlug,
  versions: {
    drafts: {
      localizeStatus: false,
    },
  },
  fields: [
    {
      type: 'text',
      name: 'title',
      localized: true,
    },
  ],
}
