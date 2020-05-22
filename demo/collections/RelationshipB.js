module.exports = {
  slug: 'relationship-b',
  labels: {
    singular: 'Relationship B',
    plural: 'Relationship B',
  },
  fields: [
    {
      name: 'post',
      label: 'Post',
      type: 'relationship',
      relationTo: 'relationship-a',
      localized: false,
    },
  ],
  timestamps: true,
};
