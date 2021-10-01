import { CollectionConfig } from '../../src/collections/config/types';

const Select: CollectionConfig = {
  slug: 'select',
  labels: {
    singular: 'Select',
    plural: 'Selects',
  },
  fields: [
    {
      name: 'Select',
      type: 'select',
      options: [{
        value: 'one',
        label: 'One',
      }, {
        value: 'two',
        label: 'Two',
      }, {
        value: 'three',
        label: 'Three',
      }],
      label: 'Select From',
      required: true,
    },
    {
      name: 'SelectHasMany',
      type: 'select',
      options: [{
        value: 'one',
        label: 'One',
      }, {
        value: 'two',
        label: 'Two',
      }, {
        value: 'three',
        label: 'Three',
      }],
      label: 'Select HasMany',
      required: true,
      hasMany: true,
    },
    {
      name: 'SelectJustStrings',
      type: 'select',
      options: ['blue', 'green', 'yellow'],
      label: 'Select Just Strings',
      required: true,
      hasMany: true,
    },
    {
      name: 'Radio',
      type: 'radio',
      options: [{
        value: 'one',
        label: 'One',
      }, {
        value: 'two',
        label: 'Two',
      }, {
        value: 'three',
        label: 'Three',
      }],
      label: 'Choose From',
      required: true,
    },
  ],
};

export default Select;
