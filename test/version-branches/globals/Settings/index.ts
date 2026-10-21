import type { GlobalConfig } from 'payload'

import { articlesSlug, queryTagsSlug, settingsSlug } from '../../slugs.js'

export const Settings: GlobalConfig = {
  slug: settingsSlug,
  access: {
    read: ({ req }) => req.context.settingsReadAccess ?? true,
    readVersions: () => true,
    update: () => true,
  },
  fields: [
    { name: 'shared', type: 'text' },
    { name: 'related', type: 'relationship', relationTo: articlesSlug, localized: true },
    { name: 'tag', type: 'relationship', relationTo: queryTagsSlug },
    { name: 'title', type: 'text', localized: true, required: true },
  ],
  versions: { drafts: { autosave: true, schedulePublish: true }, max: 1000 },
}
