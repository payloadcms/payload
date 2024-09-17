import type { CollectionConfig } from 'payload'

import { customViews1CollectionSlug } from '../slugs.js'

export const CustomViews1: CollectionConfig = {
  slug: customViews1CollectionSlug,
  admin: {
    components: {
      Description: '/components/ViewDescription/index.js#ViewDescription',
      views: {
        // This will override the entire Edit View including all nested views, i.e. `/edit/:id/*`
        // To override one specific nested view, use the nested view's slug as the key
        edit: {
          root: {
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
