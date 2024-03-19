import type { GlobalConfig } from 'payload/types'

import { CustomTabComponent } from '../components/CustomTabComponent/index.js'
import { CustomDefaultEditView } from '../components/views/CustomEditDefault/index.js'
import { CustomTabView } from '../components/views/CustomTab/index.js'
import { CustomVersionsView } from '../components/views/CustomVersions/index.js'
import { customGlobalViews2GlobalSlug } from '../slugs.js'

export const CustomGlobalViews2: GlobalConfig = {
  slug: customGlobalViews2GlobalSlug,
  admin: {
    components: {
      views: {
        Edit: {
          Default: CustomDefaultEditView,
          MyCustomView: {
            Component: CustomTabView,
            Tab: {
              href: '/custom-tab-view',
              label: 'Custom',
            },
            path: '/custom-tab-view',
          },
          MyCustomViewWithCustomTab: {
            Component: CustomTabView,
            Tab: CustomTabComponent,
            path: '/custom-tab-component',
          },
          Versions: CustomVersionsView,
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
