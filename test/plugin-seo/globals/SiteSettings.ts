import type { GlobalConfig } from 'payload'

import { siteSettingsSlug } from '../shared.js'

export const SiteSettings: GlobalConfig = {
  slug: siteSettingsSlug,
  access: {
    read: ({ req }) => req.user?.email !== 'editor@example.com',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
