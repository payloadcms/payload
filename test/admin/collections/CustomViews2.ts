import type { CollectionConfig } from 'payload'

import {
  customCollectionParamViewPath,
  customCollectionParamViewPathBase,
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
        edit: {
          // This will override one specific nested view within the `/edit/:id` route, i.e. `/edit/:id/versions`
          customViewWithParam: {
            Component: '/components/views/CustomTabWithParam/index.js#CustomTabWithParamView',
            tab: {
              href: `${customCollectionParamViewPathBase}/123`,
              label: 'Custom Param View',
            },
            path: customCollectionParamViewPath,
          },
          default: {
            tab: {
              label: customEditLabel,
            },
          },
          myCustomView: {
            Component: '/components/views/CustomTabLabel/index.js#CustomTabLabelView',
            tab: {
              href: '/custom-tab-view',
              label: customTabLabel,
            },
            path: '/custom-tab-view',
          },
          myCustomViewWithCustomTab: {
            Component: '/components/views/CustomTabComponent/index.js#CustomTabComponentView',
            tab: {
              Component: '/components/CustomTabComponent/index.js#CustomTabComponent',
            },
            path: customTabViewPath,
          },
          myCustomViewWithNestedPath: {
            Component: '/components/views/CustomTabNested/index.js#CustomNestedTabView',
            tab: {
              href: customNestedTabViewPath,
              label: 'Custom Nested Tab View',
            },
            path: customNestedTabViewPath,
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
