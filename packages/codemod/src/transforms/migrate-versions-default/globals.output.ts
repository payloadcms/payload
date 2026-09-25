import type { GlobalConfig } from 'payload'

export const Header: GlobalConfig = {
  slug: 'header',
  fields: [
    {
      name: 'nav',
      type: 'text',
    },
  ],
  versions: false,
}

export const Footer: GlobalConfig = {
  slug: 'footer',
  fields: [],
  versions: false,
}
