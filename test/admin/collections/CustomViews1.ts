import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import CustomEditView from '../components/views/CustomEdit'
import { customViews1CollectionSlug } from '../slugs'

export const CustomViews1: CollectionConfig = {
  slug: customViews1CollectionSlug,
  versions: true,
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
}
