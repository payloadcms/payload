const Conditions = {
  slug: 'conditions',
  labels: {
    singular: 'Conditions',
    plural: 'Conditions',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
    },
    {
      name: 'enable-test',
      type: 'checkbox',
      label: 'Enable Test',
    },
    {
      name: 'number',
      type: 'number',
      label: 'Number Field',
    },
    {
      name: 'simple-condition',
      type: 'text',
      label: 'Enable Test is checked',
      required: true,
      conditions: {
        'enable-test': {
          equals: true,
        },
      },
    },
    {
      name: 'or-condition',
      type: 'text',
      label: 'Number is greater than 20 OR enable-test is checked',
      required: true,
      conditions: {
        or: [
          {
            number: {
              greater_than: 20,
            },
          },
          {
            'enable-test': {
              equals: true,
            },
          },
        ],

      },
    },
    {
      name: 'nested-conditions',
      type: 'text',
      label: 'Number is either greater than 20 AND enable-test is checked, OR number is less than 20 and enable-test is NOT checked',
      conditions: {
        or: [
          {
            and: [
              {
                number: {
                  greater_than: 20,
                },
              },
              {
                'enable-test': {
                  equals: true,
                },
              },
            ],
          },
          {
            and: [
              {
                number: {
                  less_than: 20,
                },
              },
              {
                'enable-test': {
                  equals: false,
                },
              },
            ],
          },
        ],
      },
    },
  ],
};

module.exports = Conditions;
