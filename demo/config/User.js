import passportLocalMongoose from 'passport-local-mongoose';
import payloadConfig from '../payload.config';
import APIError from '../../src/lib/helpers/APIError';
import userValidate from '../User/User.validate';
const httpStatus = require('http-status');

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
  // TODO: Is having a configurable mongoose plugins array a good idea?
  // Should the user have insight as to how that will I cannot decide if this is a good pattern or not
  plugins: [{plugin: passportLocalMongoose, options: {usernameField: 'email'}}],
  statics: {
  // TODO: I grabbed these from the demo/Users/User.model.js, but I don't see anywhere that these are being used
    /**
     * Get user
     * @param {ObjectId} id - The objectId of user.
     * @returns {Promise<User, APIError>}
     */
    get(id) {
      return this.findById(id)
        .exec()
        .then(user => {
          if (user) {
            return user;
          }
          const err = new APIError('No such user exists!', httpStatus.NOT_FOUND);
          return Promise.reject(err);
        });
    },

    /**
     * List users in descending order of 'createdAt' timestamp.
     * @param {number} skip - Number of users to be skipped.
     * @param {number} limit - Limit number of users to be returned.
     * @returns {Promise<User[]>}
     */
    list({skip = 0, limit = 50} = {}) {
      return this.find()
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)
        .exec();
    },
  },
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
