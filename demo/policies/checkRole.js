/**
 * authorize a request by comparing the current user with one or more roles
 * @param allRoles
 * @param user
 * @returns {Function}
 */
const checkRole = (allRoles, user) => {
  return !!(user && allRoles.some(role => user.roles.some(individualRole => individualRole === role)));
};

module.exports = checkRole;
