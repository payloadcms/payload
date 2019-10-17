const passportLocalMongoose = require('passport-local-mongoose');
const payloadConfig = require('../payload.config');
const userValidate = require('../User/User.validate');

module.exports = {
  slug: 'users',
  labels: {
    singular: 'User',
    plural: 'users',
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
    'viewer'
  ],
  auth: {
    strategy: 'jwt',
    passwordResets: true,
    registration: true,
    registrationValidation: userValidate.post,
  },
  plugins: [{ plugin: passportLocalMongoose, options: { usernameField: 'email' } }],
  fields: [
    {
      name: 'email',
      label: 'Email Address',
      type: 'input',
      unique: true,
      maxLength: 100,
      required: true
    },
    {
      name: 'role',
      type: 'enum',
      enum: payloadConfig.roles,
      default: 'user',
    }
  ],
  timestamps: true
};
