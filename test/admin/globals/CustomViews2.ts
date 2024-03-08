import type { GlobalConfig } from '../../../packages/payload/src/globals/config/types.js'

import { CustomTabComponent } from '../components/CustomTabComponent/index.js'
import { CustomDefaultEditView } from '../components/views/CustomEditDefault/index.js'
import { CustomTabView } from '../components/views/CustomTab/index.js'
import { CustomVersionsView } from '../components/views/CustomVersions/index.js'
import { customGlobalViews2GlobalSlug } from '../slugs.js'

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
            Component: CustomTabView,
            Tab: {
              label: 'Custom',
              href: '/custom-tab-view',
            },
          },
          MyCustomViewWithCustomTab: {
            path: '/custom-tab-component',
            Component: CustomTabView,
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
