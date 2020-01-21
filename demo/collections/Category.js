const checkRole = require('../policies/checkRole');

module.exports = {
  slug: 'categories',
  labels: {
    singular: 'Category',
    plural: 'Categories',
  },
  useAsTitle: 'title',
  policies: {
    create: user => checkRole(['user', 'admin'], user),
    read: () => true,
    update: user => checkRole(['user', 'admin'], user),
    destroy: user => checkRole(['user', 'admin'], user),
  },
  fields: [
    {
      name: 'title',
      label: 'Category Title',
      type: 'input',
      maxLength: 100,
      required: true,
      unique: false,
      localized: true,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      height: 100,
      required: true,
      localized: true,
    },
    {
      name: 'page',
      label: 'Page',
      type: 'relationship',
      relationTo: 'pages',
      localized: false,
      hasMany: false,
    },
  ],
  timestamps: true,
};
