const checkRole = require('../policies/checkRole');

const policy = ({ req: { user } }) => checkRole(['admin'], user);

module.exports = {
  slug: 'public-users',
  labels: {
    singular: 'Public User',
    plural: 'Public Users',
  },
  useAsTitle: 'email',
  policies: {
    admin: () => false,
    create: () => true,
    read: () => true,
    update: ({ req: { user } }) => {
      if (checkRole(['admin'], user)) {
        return true;
      }

      if (user) {
        return {
          id: user.id,
        };
      }

      return false;
    },
    delete: ({ req: { user } }) => checkRole(['admin'], user),
  },
  auth: {
    tokenExpiration: 300,
    secureCookie: process.env.NODE_ENV === 'production',
  },
  fields: [
    {
      name: 'adminOnly',
      label: 'This field should only be readable and editable by Admins with "admin" role',
      type: 'text',
      defaultValue: 'test',
      policies: {
        create: policy,
        read: policy,
        update: policy,
      },
    },
  ],
  timestamps: true,
};
