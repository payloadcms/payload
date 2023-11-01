import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import CustomTabComponent from '../components/CustomTabComponent'
import CustomNestedView from '../components/views/CustomNestedView'
import CustomTabView from '../components/views/CustomTabView'
import CustomVersionsView from '../components/views/CustomVersions'
import CustomView from '../components/views/CustomView'
import {
  customEditLabel,
  customNestedViewPath,
  customTabLabel,
  customViewWithTabPath,
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
            Component: CustomView,
            Tab: {
              label: customTabLabel,
              href: '/custom-tab-view',
            },
          },
          MyCustomViewWithCustomTab: {
            path: customViewWithTabPath,
            Component: CustomTabView,
            Tab: CustomTabComponent,
          },
          MyCustomViewWithNestedPath: {
            path: customNestedViewPath,
            Component: CustomNestedView,
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
