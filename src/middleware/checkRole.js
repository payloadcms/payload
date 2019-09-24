export default function checkRole(role) {
  return function (req, res, next) {
    if (role !== req.user.role) res.status(401).send('Role not authorized.');
    else next();
  }
}
