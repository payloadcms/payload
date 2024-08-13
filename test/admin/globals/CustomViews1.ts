import type { GlobalConfig } from 'payload'

import { customGlobalViews1GlobalSlug } from '../slugs.js'

export const CustomGlobalViews1: GlobalConfig = {
  slug: customGlobalViews1GlobalSlug,
  admin: {
    components: {
      views: {
        edit: {
          default: {
            Component: '/components/views/CustomEdit/index.js#CustomEditView',
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
