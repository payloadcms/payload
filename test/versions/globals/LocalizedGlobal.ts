import type { GlobalConfig } from 'payload'

import { localizedGlobalSlug } from '../slugs.js'

const LocalizedGlobal: GlobalConfig = {
  slug: localizedGlobalSlug,
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
    },
    {
      name: 'content',
      type: 'text',
      localized: true,
    },
  ],
  versions: {
    drafts: true,
  },
}

export default LocalizedGlobal
