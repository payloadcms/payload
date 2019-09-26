import passportLocalMongoose from 'passport-local-mongoose';
import payloadConfig from '../payload.config';
import userValidate from '../User/User.validate';

export default {
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
  auth: {
    strategy: 'jwt',
    passwordResets: true,
    registration: true,
    registrationValidation: userValidate.post,
  },
  plugins: [{plugin: passportLocalMongoose, options: {usernameField: 'email'}}],
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
