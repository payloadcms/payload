import type { CollectionConfig } from 'payload'

import { customFieldsSlug } from '../../slugs.js'

export const CustomFields: CollectionConfig = {
  slug: customFieldsSlug,
  fields: [
    {
      name: 'customTextServerField',
      type: 'text',
      maxLength: 100,
      admin: {
        placeholder: 'This is a placeholder',
        components: {
          afterInput: ['/collections/CustomFields/AfterInput.js#AfterInput'],
          beforeInput: ['/collections/CustomFields/BeforeInput.js#BeforeInput'],
          Label: '/collections/CustomFields/fields/Text/LabelServer.js#CustomServerLabel',
          Description:
            '/collections/CustomFields/fields/Text/DescriptionServer.js#CustomServerDescription',
          Error: '/collections/CustomFields/CustomError.js#CustomError',
        },
      },
      minLength: 3,
    },
    {
      name: 'customTextClientField',
      type: 'text',
      maxLength: 100,
      admin: {
        placeholder: 'This is a placeholder',
        components: {
          afterInput: ['/collections/CustomFields/AfterInput.js#AfterInput'],
          beforeInput: ['/collections/CustomFields/BeforeInput.js#BeforeInput'],
          Label: '/collections/CustomFields/fields/Text/LabelClient.js#CustomClientLabel',
          Description:
            '/collections/CustomFields/fields/Text/DescriptionClient.js#CustomClientDescription',
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
