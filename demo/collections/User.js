const roles = require('../policies/roles');
const checkRole = require('../policies/checkRole');

module.exports = {
  slug: 'users',
  labels: {
    singular: 'User',
    plural: 'Users',
  },
  useAsTitle: 'email',
  policies: {
    create: ({ req: { user } }) => checkRole(['admin', 'user'], user),
    read: null,
    update: ({ req: { user } }) => checkRole(['admin', 'user'], user),
    delete: ({ req: { user } }) => checkRole(['admin', 'user'], user),
    admin: () => true,
  },
  hooks: {
    beforeLogin: options => options,
    afterLogin: options => options,
    delete: ({ req: { user } }) => checkRole(['admin', 'user'], user),
  },
  auth: {
    tokenExpiration: 7200,
    secretKey: 'SECRET_KEY',
  },
  fields: [
    {
      name: 'roles',
      label: 'Role',
      type: 'select',
      options: roles,
      defaultValue: 'user',
      required: true,
      saveToJWT: true,
      hasMany: true,
    },
  ],
  timestamps: true,
};
