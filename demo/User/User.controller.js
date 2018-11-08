const User = require('./User.model');
const httpStatus = require('http-status');
const passport = require('passport');
const APIError = require('../../src/lib/helpers/APIError');

const userController = {
  /**
   * Returns User when succesfully registered
   * @param req
   * @param res
   * @param next
   * @returns {*}
   */
  post: (req, res, next) => {
    User.register(new User({ email: req.body.email }), req.body.password, (err, user) => {
      if (err) {
        const error = new APIError('Authentication error', httpStatus.UNAUTHORIZED);
        return next(error);
      }
      passport.authenticate('local')(req, res, () => {
        res.json({ user });
      });
    });
  },
}

module.exports = userController;

