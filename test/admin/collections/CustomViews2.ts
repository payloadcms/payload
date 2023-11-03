import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import CustomTabComponent from '../components/CustomTabComponent'
import CustomTabView from '../components/views/CustomTab'
import CustomTabView2 from '../components/views/CustomTab2'
import CustomNestedTabView from '../components/views/CustomTabNested'
import CustomVersionsView from '../components/views/CustomVersions'
import {
  customEditLabel,
  customNestedTabViewPath,
  customTabLabel,
  customTabViewPath,
  customViews2Slug,
} from '../shared'

export const CustomViews2: CollectionConfig = {
  slug: customViews2Slug,
  versions: true,
  admin: {
    components: {
      views: {
        Edit: {
          // This will override one specific nested view within the `/edit/:id` route, i.e. `/edit/:id/versions`
          Default: {
            Tab: {
              label: customEditLabel,
            },
          },
          Versions: CustomVersionsView,
          MyCustomView: {
            path: '/custom-tab-view',
            Component: CustomTabView,
            Tab: {
              label: customTabLabel,
              href: '/custom-tab-view',
            },
          },
          MyCustomViewWithCustomTab: {
            path: customTabViewPath,
            Component: CustomTabView2,
            Tab: CustomTabComponent,
          },
          MyCustomViewWithNestedPath: {
            path: customNestedTabViewPath,
            Component: CustomNestedTabView,
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
