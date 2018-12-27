import jwt from 'jsonwebtoken';
import httpStatus from 'http-status';
import APIError from '../lib/helpers/APIError';

export default User => ({
  /**
   * Returns passport login response (cookie) when valid username and password is provided
   * @param req
   * @param res
   * @returns {*}
   */
  login: (req, res) => {
    let { email, password} = req.body;
    console.log(email);
    console.log(password);

    User.findByUsername(email, (err, user) => {
      if (err || !user) return res.status(401).json({ message: 'Auth Failed' });

      user.authenticate(password, (authErr, model, passwordError) => {
        if (authErr || passwordError) return res.status(401).json({ message: 'Auth Failed' });

        console.log('Correct password. Generating token.');
        let opts = {};
        opts.expiresIn = process.env.tokenExpiration || 1200;  // 20min default expiration
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
   * @param next
   * @returns {*}
   */
  me: (req, res) => {
    return res.status(200).send('YAY! this is a protected Route');
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
