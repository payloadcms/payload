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
      name: 'hiddenAdmin',
      type: 'text',
      label: 'Hidden on Admin',
      hidden: 'admin',
      required: true,
    },
    {
      name: 'hiddenAPI',
      type: 'text',
      label: 'Hidden on API',
      hidden: true,
      required: true, // this should not matter
    },
  ],
};

export default HiddenFields;
