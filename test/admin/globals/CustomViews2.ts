import type { GlobalConfig } from 'payload'

import { customGlobalViews2GlobalSlug } from '../slugs.js'

export const CustomGlobalViews2: GlobalConfig = {
  slug: customGlobalViews2GlobalSlug,
  admin: {
    components: {
      views: {
        Edit: {
          Default: {
            Component: '/components/views/CustomEditDefault/index.js#CustomDefaultEditView',
          },
          MyCustomView: {
            Component: '/components/views/CustomTabLabel/index.js#CustomTabLabelView',
            Tab: {
              href: '/custom-tab-view',
              label: 'Custom',
            },
            path: '/custom-tab-view',
          },
          MyCustomViewWithCustomTab: {
            Component: '/components/views/CustomTabComponent/index.js#CustomTabComponentView',
            Tab: {
              TabComponent: '/components/CustomTabComponent/index.js#CustomTabComponent',
            },
            path: '/custom-tab-component',
          },
          Versions: {
            Component: '/components/views/CustomVersions/index.js#CustomVersionsView',
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
  versions: true,
}
