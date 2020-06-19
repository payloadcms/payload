/**
 * authorize a request by comparing the current user with one or more roles
 * @param allRoles
 * @param user
 * @returns {Function}
 */
const checkRole = (allRoles, user) => {
  if (user) {
    if (allRoles.some((role) => {
      return user.roles && user.roles.some((individualRole) => {
        return individualRole === role;
      });
    })) {
      return true;
    }
  }

  return false;
};

module.exports = checkRole;
