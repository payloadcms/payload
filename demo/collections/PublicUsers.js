const checkRole = require('../policies/checkRole');

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
    read: ({ req: { user } }) => {
      if (checkRole(['admin'], user)) {
        return true;
      }

      if (user) {
        return {
          id: {
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
          id: user.id,
        };
      }

      return false;
    },
    delete: ({ req: { user } }) => checkRole(['admin'], user),
  },
  auth: {
    tokenExpiration: 300,
  },
  timestamps: true,
};
