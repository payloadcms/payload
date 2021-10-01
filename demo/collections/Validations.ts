import { CollectionConfig } from '../../src/collections/config/types';

const Validations: CollectionConfig = {
  slug: 'validations',
  labels: {
    singular: 'Validation',
    plural: 'Validations',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      label: 'Text',
      required: true,
      validate: (value) => {
        const result = value === 'test';

        if (!result) {
          return 'The only accepted value of this field is "test".';
        }

        return true;
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'lessThan10',
          label: 'Less than 10',
          type: 'number',
          required: true,
          validate: (value) => {
            const result = parseInt(value, 10) < 10;

            if (!result) {
              return 'The value of this field needs to be less than 10.';
            }

            return true;
          },
        }, {
          name: 'greaterThan10LessThan50',
          label: 'Greater than 10, Less than 50',
          type: 'number',
          required: true,
          min: 10,
          max: 50,
        },
      ],
    },
    {
      type: 'array',
      label: 'Should have at least 3 rows',
      name: 'atLeast3Rows',
      required: true,
      validate: (value) => {
        const result = value && value.length >= 3;

        if (!result) {
          return 'This array needs to have at least 3 rows.';
        }

        return true;
      },
      fields: [
        {
          type: 'number',
          name: 'greaterThan30',
          label: 'Number should be greater than 30',
          required: true,
          validate: (value) => {
            const result = value > 30;

            if (!result) {
              return 'This value of this field needs to be greater than 30.';
            }

            return true;
          },
        },
      ],
    },
    {
      type: 'array',
      label: 'Default array validation',
      name: 'array',
      required: true,
      fields: [
        {
          type: 'number',
          name: 'lessThan20',
          label: 'Number should be less than 20',
          required: true,
          validate: (value) => {
            const result = value < 30;

            if (!result) {
              return 'This value of this field needs to be less than 20.';
            }

            return true;
          },
        },
      ],
    },
  ],
};

export default Validations;
