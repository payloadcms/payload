import type { GlobalConfig } from 'payload'

import { GlobalAPIButton } from '../components/GlobalAPIButton/index.js'
import { GlobalEditButton } from '../components/GlobalEditButton/index.js'
import { globalSlug } from '../slugs.js'

export const Global: GlobalConfig = {
  slug: globalSlug,
  admin: {
    components: {
      views: {
        Edit: {
          API: {
            actions: [GlobalAPIButton],
          },
          Default: {
            actions: [GlobalEditButton],
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
