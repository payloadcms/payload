import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'

import { globalSlug } from '../shared'

export const Global: GlobalConfig = {
  slug: globalSlug,
  label: {
    en: 'My Global Label',
  },
  admin: {
    group: 'Group',
    preview: () => 'https://payloadcms.com',
  },
  versions: {
    drafts: true,
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
}
