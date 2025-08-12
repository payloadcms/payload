import type { GlobalConfig } from 'payload'

import { autosaveWithDraftButtonGlobal } from '../slugs.js'

const AutosaveWithDraftButtonGlobal: GlobalConfig = {
  slug: autosaveWithDraftButtonGlobal,
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
  ],
  label: 'Autosave with Draft Button Global',
  versions: {
    drafts: {
      autosave: {
        showSaveDraftButton: true,
        interval: 1000,
      },
    },
  },
}

export default AutosaveWithDraftButtonGlobal
