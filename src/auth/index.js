const httpStatus = require('http-status');
const passport = require('passport');
const APIError = require('../lib/helpers/APIError');

module.exports = User => ({
  /**
   * Returns passport login response (cookie) when valid username and password is provided
   * @param req
   * @param res
   * @returns {*}
   */
  login: (req, res) =>
    res.json(req.user),

  /**
   * Returns User when succesfully registered
   * @param req
   * @param res
   * @param next
   * @returns {*}
   */
  register: (req, res, next) => {
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

  /**
   * Returns User if user session is still open
   * @param req
   * @param res
   * @param next
   * @returns {*}
   */
  me: (req, res, next) => {
    if (!req.user) {
      const error = new APIError('Authentication error', httpStatus.UNAUTHORIZED);
      next(error);
    }

    res.json(req.user);
  },

  /**
   * Middleware to check user is authorised to access endpoint.
   * @param req
   * @param res
   * @param next
   * @returns {*}
   */
  check: (req, res, next) => {
    if (!req.user) {
      const error = new APIError('Authentication error', httpStatus.UNAUTHORIZED);
      next(error);
    }

    next();
  }
})
