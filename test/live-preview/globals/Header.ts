import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'

import link from '../fields/link'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      maxRows: 6,
      fields: [link()],
    },
  ],
}
