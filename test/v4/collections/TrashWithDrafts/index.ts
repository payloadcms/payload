import type { CollectionConfig } from 'payload'

import { rubbishWithDraftsSlug } from '../../slugs.js'

const RubbishWithDrafts: CollectionConfig = {
  slug: rubbishWithDraftsSlug,
  labels: {
    singular: 'Rubbish With Drafts',
    plural: 'Rubbish With Drafts',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Trash Enabled',
  },
  trash: true,
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}

export default RubbishWithDrafts
