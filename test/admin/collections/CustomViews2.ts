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
        Edit: {
          // This will override one specific nested view within the `/edit/:id` route, i.e. `/edit/:id/versions`
          CustomViewWithParam: {
            Component: '/components/views/CustomTabWithParam/index.js#CustomTabWithParamView',
            Tab: {
              href: `${customCollectionParamViewPathBase}/123`,
              label: 'Custom Param View',
            },
            path: customCollectionParamViewPath,
          },
          Default: {
            Tab: {
              label: customEditLabel,
            },
          },
          MyCustomView: {
            Component: '/components/views/CustomTabLabel/index.js#CustomTabLabelView',
            Tab: {
              href: '/custom-tab-view',
              label: customTabLabel,
            },
            path: '/custom-tab-view',
          },
          MyCustomViewWithCustomTab: {
            Component: '/components/views/CustomTabComponent/index.js#CustomTabComponentView',
            Tab: {
              TabComponent: '/components/CustomTabComponent/index.js#CustomTabComponent',
            },
            path: customTabViewPath,
          },
          MyCustomViewWithNestedPath: {
            Component: '/components/views/CustomTabNested/index.js#CustomNestedTabView',
            Tab: {
              href: customNestedTabViewPath,
              label: 'Custom Nested Tab View',
            },
            path: customNestedTabViewPath,
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
