const bindModel = model => {
  return (req, res, next) => {
    req.model = model;
    next();
  };
};

export default bindModel;
