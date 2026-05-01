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
      label: 'Content Required',
      required: true,
      admin: {
        description: 'This field is required',
      },
    },
    {
      name: 'contentReadOnly',
      type: 'textarea',
      label: 'Content Read Only',
      defaultValue:
        'Payload is the open-source, fullstack Next.js framework, giving you instant backend superpowers.',
      admin: {
        readOnly: true,
        description: 'This field is read-only',
      },
    },
    {
      name: 'contentDisabled',
      type: 'textarea',
      label: 'Content Disabled',
      defaultValue:
        'Payload is the open-source, fullstack Next.js framework, giving you instant backend superpowers.',
      admin: {
        disabled: true,
        description: 'This field is disabled',
      },
    },
  ],
}

export default TextareaFields
