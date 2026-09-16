import { APIError, type CollectionConfig } from 'payload'

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
      ({ data, originalDoc, req }) => {
        if (
          data?._status === 'draft' &&
          originalDoc?._status === 'published' &&
          req.locale === 'all'
        ) {
          throw new APIError('Custom error on unpublish', 400, {}, true)
        }
      },
    ],
  },
}

export default ErrorOnUnpublish
