import type { GlobalConfig } from 'payload'

export const Header: GlobalConfig = {
  slug: 'header',
  fields: [
    {
      name: 'nav',
      type: 'text',
    },
  ],
  authorship: false,
}

export const Footer: GlobalConfig = {
  slug: 'footer',
  fields: [],
  authorship: false,
}
