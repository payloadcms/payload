/**
 * authorize a request by comparing the current user with one or more roles
 * @param roles
 * @param user
 * @returns {Function}
 */

const checkRole = (roles, user) => {
  if (user && roles.some(role => role === user.role)) {
    return true;
  }

  return false;
};

module.exports = checkRole;
