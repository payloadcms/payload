module.exports = {
  slug: 'categories',
  labels: {
    singular: 'Category',
    plural: 'Categories',
  },
  useAsTitle: 'title',
  policies: {
    create: (req, res, next) => {
      return next();
    },
    read: () => false,
    update: (req, res, next) => {
      return next();
    },
    destroy: (req, res, next) => {
      return next();
    },
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
