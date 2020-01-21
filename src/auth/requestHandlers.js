const jwt = require('jsonwebtoken');
const passport = require('passport');
const httpStatus = require('http-status');
const APIError = require('../errors/APIError');

module.exports = (userConfig, User) => ({
  /**
   * Returns User when succesfully registered
   * @param req
   * @param res
   * @param next
   * @returns {*}
   */
  register: (req, res, next) => {
    const usernameField = userConfig.useAsUsername || 'email';

    User.register(new User({ usernameField: req.body[usernameField] }), req.body.password, (err, user) => {
      if (err) {
        const error = new APIError('Authentication error', httpStatus.UNAUTHORIZED);
        return next(error);
      }
      return passport.authenticate('local')(req, res, () => {
        return res.json({ [usernameField]: user[usernameField], role: user.role, createdAt: user.createdAt });
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
    const usernameField = userConfig.useAsUsername || 'email';
    const username = req.body[usernameField];
    const { password } = req.body;

    User.findByUsername(username, (err, user) => {
      if (err || !user) return res.status(401).json({ message: 'Auth Failed' });

      return user.authenticate(password, (authErr, model, passwordError) => {
        if (authErr || passwordError) return res.status(401).json({ message: 'Auth Failed' });

        const opts = {};
        opts.expiresIn = process.env.tokenExpiration || 7200;
        const secret = process.env.secret || 'SECRET_KEY';

        const fieldsToSign = userConfig.fields.reduce((acc, field) => {
          if (field.saveToJWT) acc[field.name] = user[field.name];
          return acc;
        }, {
          [usernameField]: username,
        });

        const token = jwt.sign(fieldsToSign, secret, opts);
        return res.status(200).json({
          message: 'Auth Passed',
          token,
        });
      });
    });
  },

  /**
   * Returns User if user session is still open
   * @param req
   * @param res
   * @returns {*}
   */
  me: (req, res) => {
    return res.status(200).send(req.user);
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
