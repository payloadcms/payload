module.exports = {
  slug: 'relationship-a',
  labels: {
    singular: 'Relationship A',
    plural: 'Relationship A',
  },
  fields: [
    {
      name: 'post',
      label: 'Post',
      type: 'relationship',
      relationTo: ['relationship-b'],
      localized: false,
      hasMany: false,
    },
  ],
  timestamps: true,
};
