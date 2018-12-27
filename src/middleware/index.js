export default ({
  role: (req, res, next) => {
    console.log(`Attempted role: ${req.params.role}`);
    console.log(`Actual role: ${req.user.role}`);
    if (req.params.role === req.user.role) next();
    next('route');
  }
})
