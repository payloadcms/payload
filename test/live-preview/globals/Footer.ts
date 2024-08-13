import type { GlobalConfig } from 'payload'

import link from '../fields/link.js'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
    update: () => true,
  },
  admin: {
    components: {
      views: {
        edit: {
          livePreview: {
            actions: ['/components/GlobalLivePreviewButton/index.js#GlobalLivePreviewButton'],
          },
        },
      },
    },
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      maxRows: 6,
      fields: [link()],
    },
  ],
}
