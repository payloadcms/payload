import type { CollectionConfig } from 'payload'

import { draftWithModifiedOnlyDisabledSlug } from '../slugs.js'

const DraftPostsWithModifiedOnlyDisabledSlug: CollectionConfig = {
  slug: draftWithModifiedOnlyDisabledSlug,
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
    showModifiedOnlyByDefault: false,
  },
}

export default DraftPostsWithModifiedOnlyDisabledSlug
