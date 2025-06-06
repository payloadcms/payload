import type { CollectionConfig } from 'payload'

import { customViews3CollectionSlug } from '../slugs.js'

export const CustomViews3: CollectionConfig = {
  slug: customViews3CollectionSlug,
  admin: {
    livePreview: {
      url: '/',
    },
    components: {
      views: {
        edit: {
          livePreview: {
            path: '',
            tab: {
              href: '',
            },
          },
          default: {
            path: '/edit',
            tab: {
              href: '/edit',
            },
          },
        },
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
  versions: true,
}
