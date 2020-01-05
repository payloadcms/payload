const payloadConfig = require('../payload.config');

module.exports = {
  slug: 'users',
  labels: {
    singular: 'User',
    plural: 'Users',
  },
  useAsTitle: 'email',
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
  roles: [
    'admin',
    'editor',
    'moderator',
    'user',
    'viewer',
  ],
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
      type: 'enum',
      enum: payloadConfig.roles,
      default: 'user',
    },
  ],
  timestamps: true,
};
