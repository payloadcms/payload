const checkRole = require('../policies/checkRole');

module.exports = {
  slug: 'uploads',
  labels: {
    singular: 'Upload',
    plural: 'Uploads',
  },
  useAsTitle: 'filename',
  policies: {
    create: user => checkRole(['user', 'admin'], user),
    read: () => true,
    update: user => checkRole(['user', 'admin'], user),
    destroy: user => checkRole(['user', 'admin'], user),
  },
  fields: [
    {
      name: 'test-custom-media-field',
      label: 'Testing a Custom Media Field',
      type: 'input',
      maxLength: 100,
      required: true,
      localized: true,
    },
  ],
  timestamps: true,
};
