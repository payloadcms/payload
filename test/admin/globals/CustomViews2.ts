import type { GlobalConfig } from 'payload'

import { customTabComponent, overriddenDefaultRouteTabLabel } from '../shared.js'
import { customGlobalViews2GlobalSlug } from '../slugs.js'

export const CustomGlobalViews2: GlobalConfig = {
  slug: customGlobalViews2GlobalSlug,
  admin: {
    components: {
      views: {
        edit: {
          api: {
            // Override the default tab component for the default route
            tab: {
              Component: {
                path: '/components/CustomTabComponent/index.js#CustomTabComponent',
                clientProps: {
                  label: overriddenDefaultRouteTabLabel,
                },
              },
            },
          },
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
            Component: {
              path: '/components/views/CustomTabComponent/index.js#CustomTabComponentView',
              clientProps: {
                label: customTabComponent,
              },
            },
            tab: {
              Component: {
                path: '/components/CustomTabComponent/index.js#CustomTabComponent',
                clientProps: {
                  label: customTabComponent,
                },
              },
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
