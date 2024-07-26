import type { CollectionConfig } from 'payload'

import { customFieldsSlug } from '../../slugs.js'
import { AfterInput } from './AfterInput.js'
import { BeforeInput } from './BeforeInput.js'
import { CustomError } from './CustomError.js'
import { FieldDescriptionComponent } from './FieldDescription/index.js'
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
          afterInput: [AfterInput],
          beforeInput: [BeforeInput],
          Label: CustomLabel,
          Description: CustomDescription,
          Error: CustomError,
        },
      },
      minLength: 3,
    },
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
