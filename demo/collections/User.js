const roles = require('../policies/roles');

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
    create: (req, res, next) => {
      return next();
    },
    read: (req, res, next) => {
      return next();
    },
    update: (req, res, next) => {
      return next();
    },
    destroy: (req, res, next) => {
      return next();
    },
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
      defaultValue: 'user',
      saveToJWT: true,
    },
  ],
  timestamps: true,
};
