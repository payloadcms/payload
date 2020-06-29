module.exports = {
  slug: 'relationship-b',
  policies: {
    read: () => true,
  },
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
      hasMany: true,
    },
  ],
  timestamps: true,
};
