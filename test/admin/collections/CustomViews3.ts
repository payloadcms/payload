import type { CollectionConfig } from 'payload'

import { customViews3CollectionSlug } from '../slugs.js'

export const CustomViews3: CollectionConfig = {
  slug: customViews3CollectionSlug,
  admin: {
    livePreview: {
      url: '/',
    },
    hideAPIURL: true,
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
          api: {
            path: '/my-api',
          },
          myCustomView: {
            path: '/api',
            Component: '/components/views/CustomAPIView/index.js#CustomAPIView',
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
