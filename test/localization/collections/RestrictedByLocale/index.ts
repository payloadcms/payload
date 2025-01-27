import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { restrictedByLocaleSlug } from '../../shared'

export const RestrictedByLocaleCollection: CollectionConfig = {
  slug: restrictedByLocaleSlug,
  access: {
    read: ({ req }) => {
      console.log({
        reqLocale: req.locale,
        userLocale: req.user.assignedLocales,
      })
      if (req.user && req.user.assignedLocales.includes(req.locale)) return true

      return false
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
    },
  ],
}
