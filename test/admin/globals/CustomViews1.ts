import type { GlobalConfig } from 'payload'

import { isRSCEnabled } from 'payload/shared'

import { customGlobalViews1GlobalSlug } from '../slugs.js'

export const CustomGlobalViews1: GlobalConfig = {
  slug: customGlobalViews1GlobalSlug,
  admin: {
    components: {
      ...(isRSCEnabled()
        ? {
            views: {
              edit: {
                default: {
                  Component: '/components/views/CustomEdit/index.js#CustomEditView',
                },
              },
            },
          }
        : {}),
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ]
}
