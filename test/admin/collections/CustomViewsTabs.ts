import type { CollectionConfig } from 'payload'

import { customViewsTabsSlug } from '../slugs.js'

export const CustomViewsTabs: CollectionConfig = {
  slug: customViewsTabsSlug,
  admin: {
    components: {
      views: {
        edit: {
          default: {
            path: '/edit',
            tab: {
              href: '/edit',
              order: 100,
            },
          },
          livePreview: {
            path: '',
            tab: {
              href: '',
              order: 0,
            },
          },
          test: {
            path: '/test',
            Component: '/components/views/CustomEdit/index.js#CustomEditView',
            tab: {
              label: 'Test',
              href: '/test',
              order: 50,
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
