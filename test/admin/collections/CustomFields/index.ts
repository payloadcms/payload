import type { CollectionConfig } from 'payload'

import { customFieldsSlug } from '../../slugs.js'
import { FieldDescriptionComponent } from './FieldDescription/index.js'
import { CustomSelect } from './fields/Select/index.js'
import { CustomDescription } from './fields/Text/Description.js'
import { CustomLabel } from './fields/Text/Label.js'

export const CustomFields: CollectionConfig = {
  slug: customFieldsSlug,
  fields: [
    {
      name: 'descriptionAsString',
      type: 'text',
      admin: {
        description: 'Static field description.',
      },
    },
    {
      name: 'descriptionAsFunction',
      type: 'text',
      admin: {
        description: () => 'Function description',
      },
    },
    {
      name: 'descriptionAsComponent',
      type: 'text',
      admin: {
        components: {
          Description: FieldDescriptionComponent,
        },
      },
    },
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
