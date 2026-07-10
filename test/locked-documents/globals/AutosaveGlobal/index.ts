import type { GlobalConfig } from 'payload'

export const autosaveGlobalSlug = 'autosave-global'

export const AutosaveGlobal: GlobalConfig = {
  slug: autosaveGlobalSlug,
  fields: [
    {
      name: 'text',
      type: 'text',
    },
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
  },
}
