const Code = {
  slug: 'code',
  labels: {
    singular: 'Code',
    plural: 'Codes',
  },
  fields: [
    {
      name: 'code',
      type: 'code',
      label: 'Code',
      required: true,
      admin: {
        language: 'js',
      },
    },
  ],
};

module.exports = Code;
