import type { CollectionConfig } from 'payload'

import { disableCopyToLocale } from '../slugs.js'

export const DisableCopyToLocale: CollectionConfig = {
  slug: disableCopyToLocale,
  admin: {
    disableCopyToLocale: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
