const checkRole = require('../policies/checkRole');

module.exports = {
  slug: 'files',
  labels: {
    singular: 'File',
    plural: 'Files',
  },
  upload: {
    staticURL: '/files',
    staticDir: 'demo/files',
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
      name: 'type',
      label: 'Type',
      type: 'select',
      options: [{
        value: 'Type 1',
        label: 'Here is a label for Type 1',
      }, {
        value: 'Type 2',
        label: 'Type 2 Label',
      }, {
        value: 'Type 3',
        label: 'Type 3 Label',
      }],
      defaultValue: 'Type 1',
      required: true,
    },
  ],
  timestamps: true,
};
