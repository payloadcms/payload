import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types.js'

import { CustomEditView } from '../components/views/CustomEdit/index.js'
import { customGlobalViews1GlobalSlug } from '../slugs.js'

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
