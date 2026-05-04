import type { GlobalConfig } from 'payload'

import { noApiViewGlobalSlug } from '../slugs.js'

export const GlobalNoApiView: GlobalConfig = {
  slug: noApiViewGlobalSlug,
  label: 'No API View',
  admin: {
    components: {
      views: {
        edit: {
          api: {
            tab: {
              condition: () => false,
            },
          },
        },
      },
    },
  },
  fields: [],
}
