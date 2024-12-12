import type { GlobalConfig } from 'payload'

import { notInViewGlobalSlug } from '../slugs.js'

export const GlobalNotInView: GlobalConfig = {
  slug: notInViewGlobalSlug,
  admin: {
    group: false,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
