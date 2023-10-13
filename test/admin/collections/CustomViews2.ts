import type { CollectionConfig } from '../../../packages/payload/src/collections/config/types'

import CustomTabComponent from '../components/CustomTabComponent'
import CustomDefaultEditView from '../components/views/CustomDefaultEdit'
import CustomVersionsView from '../components/views/CustomVersions'
import CustomView from '../components/views/CustomView'

export const CustomViews2: CollectionConfig = {
  slug: 'custom-views-two',
  versions: true,
  admin: {
    components: {
      views: {
        Edit: {
          // This will override one specific nested view within the `/edit/:id` route, i.e. `/edit/:id/versions`
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
