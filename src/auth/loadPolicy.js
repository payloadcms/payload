const passport = require('passport');
const httpStatus = require('http-status');
const { Forbidden } = require('../errors');
const formatErrorResponse = require('../responses/formatError');

const requireAuth = (req, res, next) => {
  if (!req.user) {
    res.status(httpStatus.UNAUTHORIZED).json(formatErrorResponse(new Forbidden(), 'APIError'));
  }

  return next();
};

const loadPolicy = (policy) => {
  return [
    passport.authenticate(['jwt', 'anonymous'], { session: false }),
    (req, res, next) => {
      if (policy) {
        if (!policy(req.user)) {
          return res.status(httpStatus.FORBIDDEN)
            .json(formatErrorResponse(new Forbidden(), 'APIError'));
        }

        return next();
      }
      return requireAuth(req, res, next);
    }];
};

module.exports = loadPolicy;
