import type { GlobalConfig } from 'payload'

import { autosaveWithoutLocalizationGlobalSlug } from '../slugs.js'

export const AutosaveWithoutLocalization: GlobalConfig = {
  slug: autosaveWithoutLocalizationGlobalSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
  versions: {
    drafts: {
      autosave: true,
    },
  },
}
