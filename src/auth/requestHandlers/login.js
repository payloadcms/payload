const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const APIError = require('../../errors/APIError');
const formatErrorResponse = require('../../express/responses/formatError');

/**
   * Returns passport login response (JWT) when valid username and password is provided
   * @param req
   * @param res
   * @returns {*}
   */
const login = (User, config) => (req, res) => {
  const usernameField = config.user.auth.useAsUsername;
  const username = req.body[usernameField];
  const { password } = req.body;

  User.findByUsername(username, (err, user) => {
    if (err || !user) {
      return res.status(httpStatus.UNAUTHORIZED).json(formatErrorResponse(err));
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
};

module.exports = login;
