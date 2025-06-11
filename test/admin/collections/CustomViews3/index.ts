import type { CollectionConfig } from 'payload'

import { customCollectionMetaTitle } from '../../shared.js'
import { customViews3CollectionSlug } from '../../slugs.js'

export const CustomViews3: CollectionConfig = {
  slug: customViews3CollectionSlug,
  admin: {
    meta: {
      title: customCollectionMetaTitle,
    },
    components: {
      views: {
        edit: {
          default: {
            path: '/',
            Component: '/collections/CustomViews3/MyLivePreviewView.js#MyLivePreviewView',
            tab: {
              label: 'Live Preview',
            },
          },
          livePreview: {
            Component: '/collections/CustomViews3/My404View.js#My404View',
          },
          newEdit: {
            path: '/edit',
            Component: '/collections/CustomViews3/MyEditView.js#MyEditView',
            tab: {
              label: 'Edit',
              href: '/edit',
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
