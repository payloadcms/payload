import type { GlobalConfig } from 'payload/types'

import { loggedIn } from '../access/loggedIn'
import link from '../fields/link'
import { tagRevalidator } from '../utilities/tagRevalidator'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
    update: loggedIn,
  },
  hooks: {
    afterChange: [tagRevalidator(() => 'global.header')],
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
    },
  ],
}
