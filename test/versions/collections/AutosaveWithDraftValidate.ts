import type { CollectionConfig } from 'payload'

import { autosaveWithDraftValidateSlug } from '../slugs.js'

const AutosaveWithDraftValidate: CollectionConfig = {
  slug: autosaveWithDraftValidateSlug,
  labels: {
    singular: 'Autosave with Draft Validate',
    plural: 'Autosave with Draft Validate',
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

export default AutosaveWithDraftValidate
