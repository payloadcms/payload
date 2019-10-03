const bindModelMiddleware = model => {
  return (req, res, next) => {
    req.model = model;
    next();
  };
};

export default bindModelMiddleware;
