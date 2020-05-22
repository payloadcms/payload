const HiddenFields = {
  slug: 'hidden-fields',
  labels: {
    singular: 'Hidden Fields',
    plural: 'Hidden Fields',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title - Not Hidden',
      required: true,
    },
    {
      name: 'hidden-admin',
      type: 'text',
      label: 'Hidden on Admin',
      hidden: 'admin',
      required: true,
    },
    {
      name: 'hidden-api',
      type: 'text',
      label: 'Hidden on API',
      hidden: true,
      required: true, // this should not matter
    },
  ],
};

module.exports = HiddenFields;
