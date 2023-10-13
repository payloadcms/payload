import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'

import CustomEditView from '../components/views/CustomEdit'

export const CustomGlobalViews1: GlobalConfig = {
  slug: 'custom-global-views-one',
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
