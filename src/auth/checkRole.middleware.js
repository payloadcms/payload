/**
 * authorize a request by comparing the current user with one or more roles
 * @param roles
 * @returns {Function}
 */
export default function checkRoleMiddleware(...roles) {
  return function (req, res, next) {
    if (!roles.some(role => role === req.user.role)) res.status(401).send('Role not authorized.');
    else next();
  }
}
