import type { GlobalConfig } from 'payload'

import { adminOnly, authenticated } from '../../access'

export const menuSlug = 'menu'

export const Menu: GlobalConfig = {
  slug: menuSlug,
  access: {
    read: authenticated,
    update: adminOnly,
  },
  fields: [{ name: 'globalText', type: 'text' }],
  versions: false,
}
