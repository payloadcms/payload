module.exports = {
  slug: 'relationship-a',
  policies: {
    read: () => true,
  },
  labels: {
    singular: 'Relationship A',
    plural: 'Relationship A',
  },
  fields: [
    {
      name: 'post',
      label: 'Post',
      type: 'relationship',
      relationTo: 'relationship-b',
      localized: false,
    },
  ],
  timestamps: true,
};
