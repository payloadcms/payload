import type { GlobalConfig } from 'payload'

import link from '../fields/link.js'

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
