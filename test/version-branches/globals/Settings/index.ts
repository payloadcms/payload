import type { GlobalConfig } from 'payload'

import { settingsSlug } from '../../slugs.js'

export const Settings: GlobalConfig = {
  slug: settingsSlug,
  access: { read: () => true, readVersions: () => true, update: () => true },
  fields: [
    { name: 'shared', type: 'text' },
    { name: 'title', type: 'text', localized: true, required: true },
  ],
  versions: { drafts: { autosave: true, schedulePublish: true }, max: 1000 },
}
