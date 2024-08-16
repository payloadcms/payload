import type { GlobalConfig } from 'payload'

import { customGlobalViews2GlobalSlug } from '../slugs.js'

export const CustomGlobalViews2: GlobalConfig = {
  slug: customGlobalViews2GlobalSlug,
  admin: {
    components: {
      views: {
        edit: {
          default: {
            Component: '/components/views/CustomEditDefault/index.js#CustomDefaultEditView',
          },
          myCustomView: {
            Component: '/components/views/CustomTabLabel/index.js#CustomTabLabelView',
            tab: {
              href: '/custom-tab-view',
              label: 'Custom',
            },
            path: '/custom-tab-view',
          },
          myCustomViewWithCustomTab: {
            Component: '/components/views/CustomTabComponent/index.js#CustomTabComponentView',
            tab: {
              Component: '/components/CustomTabComponent/index.js#CustomTabComponent',
            },
            path: '/custom-tab-component',
          },
          versions: {
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
