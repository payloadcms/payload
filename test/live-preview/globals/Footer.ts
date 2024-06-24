import type { GlobalConfig } from 'payload'

import GlobalLivePreviewButton from '../components/GlobalLivePreviewButton/index.js'
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
        Edit: {
          LivePreview: {
            actions: [GlobalLivePreviewButton],
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
