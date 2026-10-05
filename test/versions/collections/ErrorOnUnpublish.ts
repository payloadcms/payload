import { APIError, type CollectionConfig, type TextFieldValidation } from 'payload'

import { errorOnUnpublishSlug } from '../slugs.js'

const validateSubmittedNestedValue: TextFieldValidation = (value) =>
  typeof value === 'undefined' || (typeof value === 'string' && value.length > 0)
    ? true
    : 'Enter a value'

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
    {
      name: 'group',
      type: 'group',
      fields: [
        {
          name: 'textInGroup',
          type: 'text',
          validate: validateSubmittedNestedValue,
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data, originalDoc, req }) => {
        const isUnpublishingAllLocales = req.payloadAPI === 'REST' && req.locale === 'all'

        if (
          data?._status === 'draft' &&
          originalDoc?._status === 'published' &&
          isUnpublishingAllLocales
        ) {
          throw new APIError('Custom error on unpublish', 400, {}, true)
        }
      },
    ],
  },
  versions: {
    drafts: true,
  },
}

export default ErrorOnUnpublish
