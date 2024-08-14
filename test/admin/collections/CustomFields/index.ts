import type { CollectionConfig } from 'payload'

import { customFieldsSlug } from '../../slugs.js'

export const CustomFields: CollectionConfig = {
  slug: customFieldsSlug,
  fields: [
    {
      name: 'customTextField',
      type: 'text',
      maxLength: 100,
      admin: {
        placeholder: 'This is a placeholder',
        components: {
          afterInput: ['/collections/CustomFields/AfterInput.js#AfterInput'],
          beforeInput: ['/collections/CustomFields/BeforeInput.js#BeforeInput'],
          Label: '/collections/CustomFields/fields/Text/Label.js#CustomLabel',
          Description: '/collections/CustomFields/fields/Text/Description.js#CustomDescription',
          Error: '/collections/CustomFields/CustomError.js#CustomError',
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
          Description:
            '/collections/CustomFields/FieldDescription/index.js#FieldDescriptionComponent',
        },
      },
    },
    {
      name: 'customSelectField',
      type: 'text',
      admin: {
        components: {
          Field: '/collections/CustomFields/fields/Select/index.js#CustomSelect',
        },
      },
    },
  ],
}
