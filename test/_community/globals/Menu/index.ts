import type { GlobalConfig } from 'payload/types'

export const menuSlug = 'menu'

export const MenuGlobal: GlobalConfig = {
  slug: menuSlug,
  access: {
    read: () => true,
    update: () => false,
  },
  fields: [
    {
      name: 'globalText',
      type: 'text',
    },
  ],
}
