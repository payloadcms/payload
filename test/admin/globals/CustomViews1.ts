import type { GlobalConfig } from 'payload'

import { CustomEditView } from '../components/views/CustomEdit/index.js'
import { customGlobalViews1GlobalSlug } from '../slugs.js'

export const CustomGlobalViews1: GlobalConfig = {
  slug: customGlobalViews1GlobalSlug,
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
  versions: true,
}
