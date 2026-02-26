import type { GlobalConfig } from 'payload'

import { globalSlug } from '../slugs.js'

export const Global: GlobalConfig = {
  slug: globalSlug,
  admin: {
    group: 'Group',
    preview: () => 'https://payloadcms.com',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'sidebarField',
      type: 'text',
      admin: {
        position: 'sidebar',
      },
    },
  ],
  label: {
    en: 'My Global Label',
  },
  versions: {
    drafts: true,
  },
}
