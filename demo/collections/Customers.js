const checkRole = require('../policies/checkRole');

module.exports = {
  slug: 'customers',
  labels: {
    singular: 'Customer',
    plural: 'Customers',
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
