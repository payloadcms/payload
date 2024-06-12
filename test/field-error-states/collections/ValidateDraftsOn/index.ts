import type { CollectionConfig } from '../../../../packages/payload/src/collections/config/types'

import { slugs } from '../../shared'

export const ValidateDraftsOn: CollectionConfig = {
  slug: slugs.validateDraftsOn,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
  versions: {
    drafts: {
      validate: true,
    },
  },
}
