import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types.js'

import { CustomTabComponent } from '../components/CustomTabComponent/index.js'
import { CustomTabView } from '../components/views/CustomTab/index.js'
import { CustomTabView2 } from '../components/views/CustomTab2/index.js'
import { CustomNestedTabView } from '../components/views/CustomTabNested/index.js'
import { CustomVersionsView } from '../components/views/CustomVersions/index.js'
import {
  customEditLabel,
  customNestedTabViewPath,
  customTabLabel,
  customTabViewPath,
} from '../shared.js'
import { customViews2CollectionSlug } from '../slugs.js'

export const CustomViews2: CollectionConfig = {
  slug: customViews2CollectionSlug,
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
          MyCustomView: {
            Component: CustomTabView,
            Tab: {
              href: '/custom-tab-view',
              label: customTabLabel,
            },
            path: '/custom-tab-view',
          },
          MyCustomViewWithCustomTab: {
            Component: CustomTabView2,
            Tab: CustomTabComponent,
            path: customTabViewPath,
          },
          MyCustomViewWithNestedPath: {
            Component: CustomNestedTabView,
            path: customNestedTabViewPath,
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
