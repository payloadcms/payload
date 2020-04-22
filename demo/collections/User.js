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
    destroy: ({ req: { user } }) => checkRole(['admin', 'user'], user),
  },
  auth: {
    passwordIndex: 1,
    useAsUsername: 'email',
    tokenExpiration: 7200,
    secretKey: 'SECRET_KEY',
  },
  fields: [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      unique: true,
      maxLength: 100,
      required: true,
    },
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
