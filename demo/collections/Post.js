const checkRole = require('../policies/checkRole');

module.exports = {
  slug: 'posts',
  labels: {
    singular: 'Post',
    plural: 'Posts',
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
      label: 'Title',
      type: 'input',
      maxLength: 100,
      required: true,
      unique: true,
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
  ],
  timestamps: true,
};
