import type { GlobalConfig } from 'payload'

import { globalSlug } from '../slugs.js'

export const Global: GlobalConfig = {
  slug: globalSlug,
  admin: {
    components: {
      views: {
        edit: {
          api: {
            actions: ['/components/GlobalAPIButton/index.js#GlobalAPIButton'],
          },
          default: {
            actions: ['/components/GlobalEditButton/index.js#GlobalEditButton'],
          },
        },
      },
    },
    group: 'Group',
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
