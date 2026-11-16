import type { CollectionConfig, TextFieldValidation } from 'payload'

import { APIError } from 'payload'

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
  versions: {
    drafts: true,
  },
  hooks: {
    beforeValidate: [
      ({ data, originalDoc, req }) => {
        const unpublishAllLocales = req.url?.includes('unpublishAllLocales=true')

        if (
          data?._status === 'draft' &&
          originalDoc?._status === 'published' &&
          unpublishAllLocales
        ) {
          throw new APIError('Custom error on unpublish', 400, {}, true)
        }
      },
    ],
  },
}

export default ErrorOnUnpublish
