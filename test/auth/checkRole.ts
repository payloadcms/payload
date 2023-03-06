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

export default checkRole;
