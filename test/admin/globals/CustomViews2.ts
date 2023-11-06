import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types'

import CustomTabComponent from '../components/CustomTabComponent'
import CustomDefaultEditView from '../components/views/CustomEditDefault'
import CustomView from '../components/views/CustomTab'
import CustomVersionsView from '../components/views/CustomVersions'
import { customGlobalViews2GlobalSlug } from '../slugs'

export const CustomGlobalViews2: GlobalConfig = {
  slug: customGlobalViews2GlobalSlug,
  versions: true,
  admin: {
    components: {
      views: {
        Edit: {
          Default: CustomDefaultEditView,
          Versions: CustomVersionsView,
          MyCustomView: {
            path: '/custom-tab-view',
            Component: CustomView,
            Tab: {
              label: 'Custom',
              href: '/custom-tab-view',
            },
          },
          MyCustomViewWithCustomTab: {
            path: '/custom-tab-component',
            Component: CustomView,
            Tab: CustomTabComponent,
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
}
