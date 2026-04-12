import type { CollectionConfig } from 'payload'

import { autosaveWithDraftButtonSlug } from '../slugs.js'

const AutosaveWithDraftButtonPosts: CollectionConfig = {
  slug: autosaveWithDraftButtonSlug,
  labels: {
    singular: 'Autosave with Draft Button Post',
    plural: 'Autosave with Draft Button Posts',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'subtitle', 'createdAt', '_status'],
  },
  versions: {
    drafts: {
      autosave: {
        showSaveDraftButton: true,
        interval: 1000,
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

export default AutosaveWithDraftButtonPosts
