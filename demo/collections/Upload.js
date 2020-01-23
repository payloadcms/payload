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
    read: user => checkRole(['user', 'admin'], user),
    update: user => checkRole(['user', 'admin'], user),
    destroy: user => checkRole(['user', 'admin'], user),
  },
  fields: [
  ],
  timestamps: true,
};
