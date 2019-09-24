import jwt from 'jsonwebtoken';
import passport from 'passport';
import httpStatus from 'http-status';
import APIError from '../lib/helpers/APIError';

export default User => ({
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
        res.json({ email: user.email, role: user.role, createdAt: user.createdAt });
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
    let { email, password } = req.body;

    User.findByUsername(email, (err, user) => {
      if (err || !user) return res.status(401).json({ message: 'Auth Failed' });

      user.authenticate(password, (authErr, model, passwordError) => {
        if (authErr || passwordError) return res.status(401).json({ message: 'Auth Failed' });

        let opts = {};
        opts.expiresIn = process.env.tokenExpiration || 7200;  // 20min default expiration
        const secret = process.env.secret || 'SECRET_KEY';
        const token = jwt.sign({ email }, secret, opts);
        return res.status(200).json({
          message: 'Auth Passed',
          token
        });
      })
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

    next();
  }
})
