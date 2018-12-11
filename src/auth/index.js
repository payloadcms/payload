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
    let { email, password } = req.body;
    //This lookup would normally be done using a database
    if (email === 'james@jamestest.com') {
      if (password === 'test123') { //the password compare would normally be done using bcrypt.
        let opts = {};
        opts.expiresIn = 120;  //token expires in 2min
        const secret = 'SECRET_KEY'; //normally stored in process.env.secret
        const token = jwt.sign({ email }, secret, opts);
        return res.status(200).json({
          message: 'Auth Passed',
          token
        })
      }
    }
    return res.status(401).json({ message: 'Auth Failed' });
  },

  /**
   * Returns User if user session is still open
   * @param req
   * @param res
   * @param next
   * @returns {*}
   */
  me: (req, res) => {
    return res.status(200).send('YAY! this is a protected Route')
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
