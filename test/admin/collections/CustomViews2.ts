import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import CustomTabComponent from '../components/CustomTabComponent'
import CustomVersionsView from '../components/views/CustomVersions'
import CustomView from '../components/views/CustomView'

export const customViews2Slug = 'custom-views-two'
export const customEditLabel = 'Custom Edit Label'
export const customTabLabel = 'Custom Tab Component'

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
