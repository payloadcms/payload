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
          Field: '/collections/CustomFields/fields/Text/FieldClient.js#CustomClientField',
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
    {
      name: 'customSelectInput',
      type: 'text',
      admin: {
        components: {
          Field: '/collections/CustomFields/fields/Select/CustomInput.js#CustomInput',
        },
      },
    },
    {
      name: 'relationshipFieldWithBeforeAfterInputs',
      type: 'relationship',
      admin: {
        components: {
          afterInput: ['/collections/CustomFields/AfterInput.js#AfterInput'],
          beforeInput: ['/collections/CustomFields/BeforeInput.js#BeforeInput'],
        },
      },
      relationTo: 'posts',
    },
    {
      name: 'arrayFieldWithBeforeAfterInputs',
      type: 'array',
      admin: {
        components: {
          afterInput: ['/collections/CustomFields/AfterInput.js#AfterInput'],
          beforeInput: ['/collections/CustomFields/BeforeInput.js#BeforeInput'],
        },
      },
      fields: [
        {
          name: 'someTextField',
          type: 'text',
        },
      ],
    },
    {
      name: 'blocksFieldWithBeforeAfterInputs',
      type: 'blocks',
      admin: {
        components: {
          afterInput: ['/collections/CustomFields/AfterInput.js#AfterInput'],
          beforeInput: ['/collections/CustomFields/BeforeInput.js#BeforeInput'],
        },
      },
      blocks: [
        {
          slug: 'blockFields',
          fields: [
            {
              name: 'textField',
              type: 'text',
            },
          ],
        },
      ],
    },
    {
      label: 'Collapsible Field With Before & After Inputs',
      type: 'collapsible',
      admin: {
        components: {
          afterInput: ['/collections/CustomFields/AfterInput.js#AfterInput'],
          beforeInput: ['/collections/CustomFields/BeforeInput.js#BeforeInput'],
        },
        description: 'This is a collapsible field.',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    {
      name: 'groupFieldWithBeforeAfterInputs',
      type: 'group',
      admin: {
        components: {
          afterInput: ['/collections/CustomFields/AfterInput.js#AfterInput'],
          beforeInput: ['/collections/CustomFields/BeforeInput.js#BeforeInput'],
        },
      },
      fields: [
        {
          name: 'textOne',
          type: 'text',
        },
        {
          name: 'textTwo',
          type: 'text',
        },
      ],
    },
    {
      name: 'radioFieldWithBeforeAfterInputs',
      label: {
        en: 'Radio en',
        es: 'Radio es',
      },
      type: 'radio',
      admin: {
        components: {
          afterInput: ['/collections/CustomFields/AfterInput.js#AfterInput'],
          beforeInput: ['/collections/CustomFields/BeforeInput.js#BeforeInput'],
        },
      },
      options: [
        {
          label: { en: 'Value One', es: 'Value Uno' },
          value: 'one',
        },
        {
          label: 'Value Two',
          value: 'two',
        },
        {
          label: 'Value Three',
          value: 'three',
        },
      ],
    },
  ],
}
