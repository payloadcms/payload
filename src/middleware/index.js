export function role(role) {
  return function (req, res, next) {
    if (role !== req.user.role) res.status(401).send('Role not authorized.');
    else next();
  }
}

export default { role };
