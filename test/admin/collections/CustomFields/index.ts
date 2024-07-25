import type { CollectionConfig } from 'payload'

import { customFieldsSlug } from '../../slugs.js'
import { CustomSelect } from './fields/Select/index.js'
import { CustomDescription } from './fields/Text/Description.js'
import { CustomLabel } from './fields/Text/Label.js'

export const CustomFields: CollectionConfig = {
  slug: customFieldsSlug,
  fields: [
    {
      name: 'customTextField',
      type: 'text',
      maxLength: 100,
      admin: {
        components: {
          Label: CustomLabel,
          Description: CustomDescription,
        },
      },
    },
    {
      name: 'customSelectField',
      type: 'text',
      admin: {
        components: {
          Field: CustomSelect,
        },
      },
    },
  ],
}
