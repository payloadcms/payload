const jwt = require('jsonwebtoken');
const passport = require('passport');
const httpStatus = require('http-status');
const APIError = require('../errors/APIError');

module.exports = (config, User) => ({
  /**
   * Returns User when succesfully registered
   * @param req
   * @param res
   * @param next
   * @returns {*}
   */
  register: (req, res, next) => {
    const usernameField = config.user.auth.useAsUsername;

    User.register(new User({ usernameField: req.body[usernameField] }), req.body.password, (err, user) => {
      if (err) {
        const error = new APIError('Authentication error', httpStatus.UNAUTHORIZED);
        return next(error);
      }
      return passport.authenticate('local')(req, res, () => {
        return res.json({
          [usernameField]: user[usernameField],
          role: user.role,
          createdAt: user.createdAt,
        });
      });
    });
  },

  /**
   * Returns passport login response (cookie) when valid username and password is provided
   * @param req
   * @param res
   * @returns {*}
   */
  login: (req, res) => {
    const usernameField = config.user.auth.useAsUsername;
    const username = req.body[usernameField];
    const { password } = req.body;

    User.findByUsername(username, (err, user) => {
      if (err || !user) {
        return new APIError('Authentication Failed', httpStatus.UNAUTHORIZED);
      }

      return user.authenticate(password, (authErr, model, passwordError) => {
        if (authErr || passwordError) return new APIError('Authentication Failed', httpStatus.UNAUTHORIZED);

        const opts = {};
        opts.expiresIn = config.user.auth.tokenExpiration;
        const secret = config.user.auth.secretKey;

        const fieldsToSign = config.user.fields.reduce((acc, field) => {
          if (field.saveToJWT) acc[field.name] = user[field.name];
          return acc;
        }, {
          [usernameField]: username,
        });

        const token = jwt.sign(fieldsToSign, secret, opts);
        return res.status(200)
          .json({
            message: 'Auth Passed',
            token,
          });
      });
    });
  },

  /**
   * Refresh an expired or soon to be expired auth token
   * @param req
   * @param res
   * @param next
   */
  refresh: (req, res, next) => {
    const { token } = req.body;
    const secret = config.user.auth.secretKey;
    const opts = {};
    opts.expiresIn = config.user.auth.tokenExpiration;

    try {
      jwt.verify(token, secret, {});
      const refreshToken = jwt.sign(token, secret);
      res.status(200)
        .json({
          message: 'Token Refresh Successful',
          refreshToken,
        });
    } catch (e) {
      next(new APIError('Authentication error', httpStatus.UNAUTHORIZED));
    }
  },

  /**
   * Returns User if user session is still open
   * @param req
   * @param res
   * @returns {*}
   */
  me: (req, res) => {
    return res.status(200)
      .send(req.user);
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

    return next();
  },
});
