import type { CollectionConfig } from 'payload'

import { textFields } from './Text'
import { textareaFields } from './Textarea'

export const CustomFields: CollectionConfig = {
  slug: 'custom-fields',
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
    },
    ...textFields,
    ...textareaFields,
  ],
}
