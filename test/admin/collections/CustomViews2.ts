import type { CollectionConfig } from 'payload'

import {
  customCollectionMetaTitle,
  customCollectionParamViewPath,
  customCollectionParamViewPathBase,
  customDefaultTabMetaTitle,
  customEditLabel,
  customNestedTabViewPath,
  customTabLabel,
  customTabViewPath,
  customVersionsTabMetaTitle,
  customViewMetaTitle,
} from '../shared.js'
import { customViews2CollectionSlug } from '../slugs.js'

export const CustomViews2: CollectionConfig = {
  slug: customViews2CollectionSlug,
  admin: {
    meta: {
      title: customCollectionMetaTitle,
    },
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
            meta: {
              title: customDefaultTabMetaTitle,
            },
          },
          myCustomView: {
            Component: '/components/views/CustomTabLabel/index.js#CustomTabLabelView',
            tab: {
              href: '/custom-tab-view',
              label: customTabLabel,
            },
            path: '/custom-tab-view',
            meta: {
              title: customViewMetaTitle,
            },
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
            meta: {
              title: 'Custom Nested Meta Title',
            },
          },
          versions: {
            Component: '/components/views/CustomVersions/index.js#CustomVersionsView',
            meta: {
              title: customVersionsTabMetaTitle,
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
