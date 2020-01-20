const roles = require('../policies/roles');
const checkRole = require('../policies/checkRole');

module.exports = {
  slug: 'users',
  labels: {
    singular: 'User',
    plural: 'Users',
  },
  useAsTitle: 'email',
  useAsUsername: 'email',
  passwordIndex: 1,
  policies: {
    create: user => checkRole(['admin'], user),
    read: null,
    update: user => checkRole(['admin'], user),
    destroy: user => checkRole(['admin'], user),
  },
  auth: {
    strategy: 'jwt',
    passwordResets: true,
    registration: true,
  },
  fields: [
    {
      name: 'email',
      label: 'Email Address',
      type: 'input',
      unique: true,
      maxLength: 100,
      required: true,
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      options: roles,
      default: 'user',
    },
  ],
  timestamps: true,
};
