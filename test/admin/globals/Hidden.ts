import type { GlobalConfig } from 'payload'

import { hiddenGlobalSlug } from '../slugs.js'

export const GlobalHidden: GlobalConfig = {
  slug: hiddenGlobalSlug,
  admin: {
    hidden: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
