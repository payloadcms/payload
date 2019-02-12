function role(allowedRole) {
  return function (req, res, next) {
    if (allowedRole !== req.user.role) res.status(401).send('Role not authorized.');
    else next();
  }
}

export default role;
