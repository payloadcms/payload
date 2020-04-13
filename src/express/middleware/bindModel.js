const bindModelMiddleware = (Model) => {
  return (req, res, next) => {
    req.Model = Model;
    next();
  };
};

module.exports = bindModelMiddleware;
