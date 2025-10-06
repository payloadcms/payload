import type { CollectionConfig } from 'payload'

import { APIError } from 'payload'

import { errorOnUnpublishSlug } from '../slugs.js'

const ErrorOnUnpublish: CollectionConfig = {
  slug: errorOnUnpublishSlug,
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
  ],
  versions: {
    drafts: true,
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc }) => {
        if (data?._status === 'draft' && originalDoc?._status === 'published') {
          throw new APIError('Custom error on unpublish', 400, {}, true)
        }
      },
    ],
  },
}

export default ErrorOnUnpublish
