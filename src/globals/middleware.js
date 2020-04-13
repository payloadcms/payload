const getMiddleware = (global) => {
  return (req, res, next) => {
    req.global = global;
    next();
  };
};

module.exports = getMiddleware;
