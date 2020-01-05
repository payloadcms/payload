const HttpStatus = require('http-status');

/**
 * authorize a request by comparing the current user with one or more roles
 * @param roles
 * @returns {Function}
 */

const checkRoleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(HttpStatus.UNAUTHORIZED)
        .send('Not Authorized');
    } else if (!roles.some(role => role === req.user.role)) {
      res.status(HttpStatus.FORBIDDEN)
        .send('Role not authorized.');
    } else {
      next();
    }
  };
};

module.exports = checkRoleMiddleware;
