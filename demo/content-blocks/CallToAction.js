module.exports = {
  labels: {
    singular: 'Call to Action',
    plural: 'Calls to Action',
  },
  fields: [
    {
      name: 'label',
      label: 'Label',
      type: 'input',
      maxLength: 100,
      required: true,
    },
    {
      name: 'url',
      label: 'URL',
      type: 'input',
      height: 100,
      required: true,
    },
  ],
};
