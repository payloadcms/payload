import type { GlobalConfig } from 'payload'

import link from '../../fields/link'
import { revalidateMainMenu } from './hooks/revalidateMainMenu'

export const MainMenu: GlobalConfig = {
  slug: 'main-menu',
  access: {
    read: () => true,
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
      maxRows: 6,
    },
  ],
  hooks: {
    afterChange: [revalidateMainMenu],
  },
}
