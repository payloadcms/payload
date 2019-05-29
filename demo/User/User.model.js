import mongoose from 'mongoose';
import httpStatus from 'http-status';
import passportLocalMongoose from 'passport-local-mongoose';
import APIError from '../../src/lib/helpers/APIError';

/**
 * User Schema
 */
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
  role: { type: String, enum: [ 'user', 'agent', 'admin' ], default: 'user' },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */

/**
 * Methods
 */
UserSchema.method({});

/**
 * Statics
 */
UserSchema.statics = {

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
  list({ skip = 0, limit = 50 } = {}) {
    return this.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  },
};

UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' });

/**
 * @typedef User
 */
export default mongoose.model('User', UserSchema);
