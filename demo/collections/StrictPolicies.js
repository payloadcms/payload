const checkRole = require('../policies/checkRole');

module.exports = {
  slug: 'strict-policies',
  labels: {
    singular: 'Strict Policy',
    plural: 'Strict Policies',
  },
  useAsTitle: 'email',
  policies: {
    create: () => true,
    read: ({ req: { user } }) => {
      if (checkRole(['admin'], user)) {
        return true;
      }

      if (user) {
        return {
          owner: {
            equals: user.id,
          },
        };
      }

      return false;
    },
    update: ({ req: { user } }) => {
      if (checkRole(['admin'], user)) {
        return true;
      }

      if (user) {
        return {
          owner: {
            equals: user.id,
          },
        };
      }

      return false;
    },
    delete: ({ req: { user } }) => checkRole(['admin'], user),
  },
  fields: [
    {
      name: 'address',
      type: 'text',
      label: 'Address',
      required: true,
    },
    {
      name: 'city',
      type: 'text',
      label: 'City',
      required: true,
    },
    {
      name: 'state',
      type: 'text',
      label: 'State',
      required: true,
    },
    {
      name: 'zip',
      type: 'number',
      label: 'ZIP Code',
      required: true,
    },
  ],
  timestamps: true,
};
