import type { CollectionConfig } from 'payload'

import { beforeValidateSlug } from '../../collectionSlugs.js'

export const BeforeValidateCollection: CollectionConfig = {
  slug: beforeValidateSlug,
  fields: [
    {
      type: 'text',
      name: 'title',
      hooks: {
        beforeValidate: [
          () => {
            return 'reset in beforeValidate'
          },
        ],
      },
    },
  ],
}
