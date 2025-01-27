import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'

import GlobalLivePreviewButton from '../components/GlobalLivePreviewButton'
import link from '../fields/link'

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
