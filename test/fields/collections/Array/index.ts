import type { CollectionConfig } from '../../../../src/collections/config/types';

export const arrayDefaultValue = [
  { text: 'row one' },
  { text: 'row two' },
];

export const arrayFieldsSlug = 'array-fields';

const ArrayFields: CollectionConfig = {
  slug: arrayFieldsSlug,
  fields: [
    {
      name: 'items',
      type: 'array',
      required: true,
      defaultValue: arrayDefaultValue,
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'localized',
      type: 'array',
      required: true,
      localized: true,
      defaultValue: arrayDefaultValue,
      fields: [
        {
          name: 'text',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      type: 'array',
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
          type: 'text',
          name: 'text',
        },
      ],
    },
    {
      type: 'array',
      name: 'potentiallyEmptyArray',
      fields: [
        {
          type: 'text',
          name: 'text',
        },
      ],
    },
  ],
};

export const arrayDoc = {
  items: [
    {
      text: 'first row',
    },
    {
      text: 'second row',
    },
    {
      text: 'third row',
    },
    {
      text: 'fourth row',
    },
    {
      text: 'fifth row',
    },
    {
      text: 'sixth row',
    },
  ],
};

export default ArrayFields;
