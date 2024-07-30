import type { GlobalConfig } from 'payload'

import { globalSlug } from '../slugs.js'

export const Global: GlobalConfig = {
  slug: globalSlug,
  admin: {
    components: {
      views: {
        Edit: {
          API: {
            actions: ['/components/GlobalAPIButton/index.js#GlobalAPIButton'],
          },
          Default: {
            actions: ['/components/GlobalEditButton/index.js#GlobalEditButton'],
          },
        },
      },
    },
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
