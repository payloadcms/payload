import type { CollectionConfig } from 'payload'

import { APIError } from 'payload'

import { draftWithChangeHookCollectionSlug } from '../slugs.js'

const DraftWithChangeHookPosts: CollectionConfig = {
  slug: draftWithChangeHookCollectionSlug,
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
      hooks: {
        beforeChange: [
          (args) => {
            if (args?.data?.title?.includes('Invalid')) {
              throw new APIError('beforeChange hook threw APIError 422', 422)
            }
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      required: true,
    },
  ],
  versions: {
    drafts: {
      schedulePublish: {
        timeFormat: 'HH:mm',
      },
    },
    maxPerDoc: 0,
  },
}

export default DraftWithChangeHookPosts
