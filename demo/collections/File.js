const path = require('path');
const checkRole = require('../policies/checkRole');

const policy = ({ req: { user } }) => {
  const isAdmin = checkRole(['admin'], user);

  if (isAdmin) {
    return true;
  }

  if (user) {
    return {
      owner: {
        equals: user.id,
      },
    };
  }
};

module.exports = {
  slug: 'files',
  labels: {
    singular: 'File',
    plural: 'Files',
  },
  upload: {
    staticURL: '/files',
    staticDir: path.resolve(__dirname, '../files'),
  },
  policies: {
    create: () => true,
    read: policy,
    update: policy,
    delete: policy,
  },
  useAsTitle: 'filename',
  fields: [
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: [{
        value: 'Type 1',
        label: 'Type 1 Label',
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
    {
      name: 'owner',
      label: 'Owner',
      type: 'relationship',
      relationTo: 'admins',
      required: true,
    },
  ],
  timestamps: true,
};
