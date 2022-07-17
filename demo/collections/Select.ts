import { CollectionConfig } from '../../src/collections/config/types';

const Select: CollectionConfig = {
  slug: 'select',
  labels: {
    singular: 'Select',
    plural: 'Selects',
  },
  fields: [
    {
      name: 'select',
      type: 'select',
      options: [
        {
          value: 'one',
          label: 'One',
        },
        {
          value: 'two',
          label: 'Two',
        },
        {
          value: 'three',
          label: 'Three',
        },
      ],
      label: 'Select From',
      required: true,
    },
    {
      name: 'selectHasMany',
      type: 'select',
      options: [
        {
          value: 'one',
          label: 'One',
        },
        {
          value: 'two',
          label: 'Two',
        },
        {
          value: 'three',
          label: 'Three',
        },
      ],
      label: 'Select HasMany',
      required: true,
      hasMany: true,
    },
    {
      name: 'selectJustStrings',
      type: 'select',
      options: ['blue', 'green', 'yellow'],
      label: 'Select Just Strings',
      required: true,
      hasMany: true,
    },
    {
      name: 'selectWithEmptyString',
      type: 'select',
      defaultValue: '',
      options: [
        {
          value: '',
          label: 'None',
        },
        {
          value: 'option',
          label: 'Option',
        },
      ],
      required: true,
    },
    {
      name: 'radio',
      type: 'radio',
      options: [
        {
          value: 'one',
          label: 'One',
        },
        {
          value: 'two',
          label: 'Two',
        },
        {
          value: 'three',
          label: 'Three',
        },
      ],
      label: 'Choose From',
      required: true,
    },
    {
      name: 'radioWithEmptyString',
      type: 'radio',
      defaultValue: '',
      options: [
        {
          value: '',
          label: 'None',
        },
        {
          value: 'one',
          label: 'One',
        },
        {
          value: 'two',
          label: 'Two',
        },
      ],
      required: true,
    },
  ],
};

export default Select;
