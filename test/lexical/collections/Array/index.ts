import type { CollectionConfig } from 'payload'

import { arrayFieldsSlug } from '../../slugs.js'

export const arrayDefaultValue = [{ text: 'row one' }, { text: 'row two' }]

const ArrayFields: CollectionConfig = {
  admin: {
    enableRichTextLink: false,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: false,
    },
    {
      name: 'items',
      defaultValue: arrayDefaultValue,
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
        {
          name: 'anotherText',
          type: 'text',
        },
        {
          name: 'uiField',
          type: 'ui',
          admin: {
            components: {
              Field: {
                path: './collections/Array/LabelComponent.js#ArrayRowLabel',
                serverProps: {
                  // While this doesn't do anything, this will reproduce a bug where having server-only props in here will throw a "Functions cannot be passed directly to Client Components" error
                  someFn: () => 'Hello',
                },
              },
            },
          },
        },
        {
          name: 'localizedText',
          type: 'text',
          localized: true,
        },
        {
          name: 'subArray',
          fields: [
            {
              name: 'text',
              type: 'text',
            },
            {
              name: 'textTwo',
              label: 'Second text field',
              type: 'text',
              required: true,
              defaultValue: 'default',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'textInRow',
                  type: 'text',
                  required: true,
                  defaultValue: 'default',
                },
              ],
            },
          ],
          type: 'array',
        },
      ],
      required: true,
      type: 'array',
    },
    {
      name: 'collapsedArray',
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'text',
          required: true,
          type: 'text',
        },
      ],
      type: 'array',
    },
    {
      name: 'localized',
      defaultValue: arrayDefaultValue,
      fields: [
        {
          name: 'text',
          required: true,
          type: 'text',
        },
      ],
      localized: true,
      required: true,
      type: 'array',
    },
    {
      name: 'readOnly',
      admin: {
        readOnly: true,
      },
      defaultValue: [
        {
          text: 'defaultValue',
        },
        {
          text: 'defaultValue2',
        },
      ],
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
      type: 'array',
    },
    {
      name: 'potentiallyEmptyArray',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
        {
          name: 'groupInRow',
          fields: [
            {
              name: 'textInGroupInRow',
              type: 'text',
            },
          ],
          type: 'group',
        },
      ],
      type: 'array',
    },
    {
      name: 'rowLabelAsComponent',
      admin: {
        components: {
          RowLabel: '/collections/Array/LabelComponent.js#ArrayRowLabel',
        },
        description: 'Row labels rendered as react components.',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
        },
      ],
      type: 'array',
    },
    {
      name: 'arrayWithMinRows',
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
      minRows: 2,
      type: 'array',
    },
    {
      name: 'disableSort',
      defaultValue: arrayDefaultValue,
      admin: {
        isSortable: false,
      },
      fields: [
        {
          name: 'text',
          required: true,
          type: 'text',
        },
      ],
      type: 'array',
    },
    {
      name: 'nestedArrayLocalized',
      type: 'array',
      fields: [
        {
          type: 'array',
          name: 'array',
          fields: [
            {
              name: 'text',
              type: 'text',
              localized: true,
            },
          ],
        },
      ],
    },
    {
      name: 'externallyUpdatedArray',
      type: 'array',
      fields: [
        {
          name: 'customTextField',
          type: 'ui',
          admin: {
            components: {
              Field: '/collections/Array/CustomTextField.js#CustomTextField',
            },
          },
        },
      ],
    },
    {
      name: 'customArrayField',
      type: 'array',
      admin: {
        components: {
          Field: '/collections/Array/CustomArrayField.js#CustomArrayField',
        },
      },
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
    {
      name: 'ui',
      type: 'ui',
      admin: {
        components: {
          Field: '/collections/Array/AddRowButton.js',
        },
      },
    },
    {
      name: 'arrayWithLabels',
      type: 'array',
      labels: {
        singular: ({ t }) => t('authentication:account'),
        plural: ({ t }) => t('authentication:generate'),
      },
      fields: [
        {
          name: 'text',
          type: 'text',
        },
      ],
    },
  ],
  slug: arrayFieldsSlug,
  versions: true,
}

export default ArrayFields
