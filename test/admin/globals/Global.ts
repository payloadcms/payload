import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'

import GlobalAPIButton from '../components/GlobalAPIButton'
import GlobalEditButton from '../components/GlobalEditButton'
import { globalSlug } from '../slugs'

export const Global: GlobalConfig = {
  slug: globalSlug,
  label: {
    en: 'My Global Label',
  },
  admin: {
    components: {
      views: {
        Edit: {
          Default: {
            actions: [GlobalEditButton],
          },
          API: {
            actions: [GlobalAPIButton],
          },
        },
      },
    },
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
