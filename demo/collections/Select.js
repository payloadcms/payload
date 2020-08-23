const Select = {
  slug: 'select',
  labels: {
    singular: 'Select',
    plural: 'selects',
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
  ],
};

module.exports = Select;
