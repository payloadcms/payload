import type { CollectionConfig } from 'payload'

import { draftWithModifiedOnlySlug } from '../slugs.js'

const DraftPostsWithModifiedOnly: CollectionConfig = {
  slug: draftWithModifiedOnlySlug,
  admin: {
    defaultColumns: ['title', 'description', 'createdAt', '_status'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      localized: true,
      required: true,
      unique: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      required: true,
    },
  ],
  versions: {
    showModifiedOnlyByDefault: true,
  },
}

export default DraftPostsWithModifiedOnly
