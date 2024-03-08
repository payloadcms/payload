import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types.js'

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
