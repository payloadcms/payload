const bindModelMiddleware = (model) => {
  return (req, res, next) => {
    req.model = model;
    next();
  };
};

module.exports = bindModelMiddleware;
