module.exports = {
  slug: 'validations',
  labels: {
    singular: 'Validation',
    plural: 'Validations',
  },
  policies: {
    read: () => true,
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      label: 'Text',
      required: true,
      validate: value => value === 'test',
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
            return result;
          },
        }, {
          name: 'Greater than 10',
          label: 'Greater than 10',
          type: 'number',
          required: true,
          validate: value => value > 10,
        },
      ],
    },
    {
      type: 'repeater',
      label: 'Should have at least 3 rows',
      name: 'atLeast3Rows',
      required: true,
      validate: (value) => {
        console.log(value);
        return value && value.length > 3;
      },
      fields: [
        {
          type: 'number',
          name: 'greaterThan30',
          label: 'Number should be greater than 30',
          required: true,
          validate: value => value > 30,
        },
      ],
    },
  ],
  timestamps: true,
};
