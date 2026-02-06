import type { CollectionConfig } from 'payload'

import { reorderTabsSlug } from '../slugs.js'

export const ReorderTabs: CollectionConfig = {
  slug: reorderTabsSlug,
  admin: {
    components: {
      views: {
        edit: {
          default: {
            tab: {
              order: 100,
            },
          },
          api: {
            tab: {
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
