const bindGlobalMiddleware = (global) => {
  return (req, res, next) => {
    req.global = global;
    next();
  };
};

module.exports = bindGlobalMiddleware;
