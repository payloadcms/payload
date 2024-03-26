import type { CollectionConfig } from 'payload/types'

import { CustomTabComponent } from '../components/CustomTabComponent/index.js'
import { CustomTabComponentView } from '../components/views/CustomTabComponent/index.js'
import { CustomTabLabelView } from '../components/views/CustomTabLabel/index.js'
import { CustomNestedTabView } from '../components/views/CustomTabNested/index.js'
import { CustomTabWithParamView } from '../components/views/CustomTabWithParam/index.js'
import { CustomVersionsView } from '../components/views/CustomVersions/index.js'
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
          Default: {
            Tab: {
              label: customEditLabel,
            },
          },
          MyCustomView: {
            Component: CustomTabLabelView,
            Tab: {
              href: '/custom-tab-view',
              label: customTabLabel,
            },
            path: '/custom-tab-view',
          },
          MyCustomViewWithCustomTab: {
            Component: CustomTabComponentView,
            Tab: CustomTabComponent,
            path: customTabViewPath,
          },
          MyCustomViewWithNestedPath: {
            Component: CustomNestedTabView,
            path: customNestedTabViewPath,
            tab: {
              label: 'Custom Nested Tab View',
              href: customNestedTabViewPath,
            },
          },
          Versions: CustomVersionsView,
          CustomViewWithParam: {
            Component: CustomTabWithParamView,
            path: customCollectionParamViewPath,
            Tab: {
              label: 'Custom Param View',
              href: `${customCollectionParamViewPathBase}/123`,
            },
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
