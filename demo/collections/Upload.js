const checkRole = require('../policies/checkRole');

module.exports = {
  slug: 'uploads',
  labels: {
    singular: 'Upload',
    plural: 'Uploads',
  },
  useAsTitle: 'filename',
  policies: {
    create: ({ req: { user } }) => checkRole(['user', 'admin'], user),
    read: ({ req: { user } }) => checkRole(['user', 'admin'], user),
    update: ({ req: { user } }) => checkRole(['user', 'admin'], user),
    destroy: ({ req: { user } }) => checkRole(['user', 'admin'], user),
  },
  fields: [
    {
      name: 'alt',
      label: 'Alt Text',
      type: 'text',
      required: true,
      localized: true,
    },
  ],
  timestamps: true,
};
