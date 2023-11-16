import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'

import { hiddenGlobalSlug } from '../slugs'

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
