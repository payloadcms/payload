import type { CollectionConfig } from 'payload'

import { draftWithValidateCollectionSlug } from '../slugs.js'

const DraftsWithValidate: CollectionConfig = {
  slug: draftWithValidateCollectionSlug,
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

export default DraftsWithValidate
