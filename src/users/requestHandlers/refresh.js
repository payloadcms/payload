const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const { Forbidden, APIError } = require('../../errors');
const formatErrorResponse = require('../../express/responses/formatError');

/**
   * Refresh an expired or soon to be expired auth token
   * @param req
   * @param res
   * @param next
   */
const refresh = config => (req, res, next) => {
  const secret = config.user.auth.secretKey;
  const opts = {};
  opts.expiresIn = config.user.auth.tokenExpiration;

  try {
    const token = req.headers.authorization.replace('JWT ', '');
    jwt.verify(token, secret, {});
    const refreshedToken = jwt.sign(token, secret);
    res.status(200)
      .json({
        message: 'Token Refresh Successful',
        refreshedToken,
      });
  } catch (e) {
    if (e.status && e.status === 401) {
      return res.status(httpStatus.FORBIDDEN).send(formatErrorResponse(new Forbidden()));
    }

    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send(formatErrorResponse(new APIError()));
  }
};

module.exports = refresh;
