  export function role(role) {
    return function (req, res, next) {
      if (role !== req.user.role) res.send(401, 'Role not authorized.');
      else next();
    }
  }

  export function atLeastRole(roleList, permittedRole) {
    return function(req, res, next) {
      let actualRoleIndex = roleList.indexOf(req.user.role);
      if (actualRoleIndex === -1) res.status(400).send('Invalid role.');

      let permittedRoleIndex = roleList.indexOf(permittedRole);
      if (permittedRoleIndex === -1) res.status(500).send();

      if (actualRoleIndex <= permittedRoleIndex) next();

      res.status(401).send('Role not authorized.');
    }
  }

export default { role, atLeastRole };
