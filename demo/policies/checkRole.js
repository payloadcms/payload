/**
 * authorize a request by comparing the current user with one or more roles
 * @param roles
 * @param user
 * @returns {Function}
 */
const checkRole = (allRoles, user) => {
  const hasPermission = !!(user && allRoles.some(role => user.roles.some(individualRole => individualRole === role)));
  return hasPermission;
};

module.exports = checkRole;
