import type { GlobalConfig } from 'payload'

import { settingsGlobalSlug } from '../slugs.js'

export const Settings: GlobalConfig = {
  slug: settingsGlobalSlug,
  fields: [
    {
      type: 'checkbox',
      name: 'canAccessProtected',
    },
  ],
}
