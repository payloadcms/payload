import type { GlobalConfig } from 'payload'

import { versionsDisabledGlobalSlug } from '../slugs.js'

export const VersionsDisabledGlobal: GlobalConfig = {
  slug: versionsDisabledGlobalSlug,
  access: {
    readVersions: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: false,
}
