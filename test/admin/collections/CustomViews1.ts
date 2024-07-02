import type { CollectionConfig } from 'payload'

import { CustomEditView } from '../components/views/CustomEdit/index.js'
import { customViews1CollectionSlug } from '../slugs.js'

export const CustomViews1: CollectionConfig = {
  slug: customViews1CollectionSlug,
  admin: {
    components: {
      views: {
        // This will override the entire Edit view including all nested views, i.e. `/edit/:id/*`
        // To override one specific nested view, use the nested view's slug as the key
        Edit: CustomEditView,
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
