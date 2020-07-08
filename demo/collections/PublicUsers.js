const checkRole = require('../access/checkRole');

const access = ({ req: { user } }) => checkRole(['admin'], user);

module.exports = {
  slug: 'public-users',
  labels: {
    singular: 'Public User',
    plural: 'Public Users',
  },
  useAsTitle: 'email',
  access: {
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
      access: {
        create: access,
        read: access,
        update: access,
      },
    },
  ],
  timestamps: true,
};
