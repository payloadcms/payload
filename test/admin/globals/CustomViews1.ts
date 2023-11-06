import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'

import CustomEditView from '../components/views/CustomEdit'
import { customGlobalViews1GlobalSlug } from '../slugs'

export const CustomGlobalViews1: GlobalConfig = {
  slug: customGlobalViews1GlobalSlug,
  versions: true,
  admin: {
    components: {
      views: {
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
