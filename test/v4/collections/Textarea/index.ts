import type { CollectionConfig } from 'payload'

import { textareaFieldsSlug } from '../../slugs.js'

const TextareaFields: CollectionConfig = {
  slug: textareaFieldsSlug,
  fields: [
    {
      name: 'content',
      type: 'textarea',
      label: 'Content',
      admin: {
        description: 'The main body content for this entry',
      },
    },
    {
      name: 'contentRequired',
      type: 'textarea',
      label: 'Content',
      required: true,
      admin: {
        description: 'The main body content for this entry',
      },
    },
    {
      name: 'contentDisabled',
      type: 'textarea',
      label: 'Content',
      admin: {
        readOnly: true,
        description: 'The main body content for this entry',
      },
    },
  ],
}

export default TextareaFields
