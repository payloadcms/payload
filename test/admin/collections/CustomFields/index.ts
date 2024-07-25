import type { CollectionConfig } from 'payload'

import { customFieldsSlug } from '../../slugs.js'
import { CustomSelect } from './fields/Select/index.js'
import { CustomTextDescription } from './fields/Text/Description.js'
import { CustomTextLabel } from './fields/Text/Label.js'

export const CustomFields: CollectionConfig = {
  slug: customFieldsSlug,
  fields: [
    {
      name: 'customTextDescriptionField',
      type: 'text',
      maxLength: 100,
      admin: {
        components: {
          Label: CustomTextLabel,
          Description: CustomTextDescription,
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
