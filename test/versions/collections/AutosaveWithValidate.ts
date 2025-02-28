import type { CollectionConfig } from 'payload'

import { autosaveWithValidateCollectionSlug } from '../slugs.js'

const AutosaveWithValidatePosts: CollectionConfig = {
  slug: autosaveWithValidateCollectionSlug,
  labels: {
    singular: 'Autosave with Validate Post',
    plural: 'Autosave with Validate Posts',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'subtitle', 'createdAt', '_status'],
  },
  versions: {
    maxPerDoc: 35,
    drafts: {
      validate: true,
      autosave: {
        interval: 250,
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
}

export default AutosaveWithValidatePosts
