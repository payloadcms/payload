import type { GlobalConfig } from 'payload'

export const globalDraftsSlug = 'global-drafts'

export const GlobalDrafts: GlobalConfig = {
  slug: globalDraftsSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
  ],
  versions: {
    drafts: true,
  },
}
