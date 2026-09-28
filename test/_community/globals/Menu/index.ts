import type { GlobalConfig } from 'payload'

export const menuSlug = 'menu'

export const MenuGlobal: GlobalConfig = {
  slug: menuSlug,
  admin: {
    group: 'Content',
  },
  fields: [
    {
      name: 'globalText',
      type: 'text',
    },
  ],
  versions: false,
}
