const bindCollectionMiddleware = (collection) => {
  return (req, res, next) => {
    req.collection = collection;
    next();
  };
};

module.exports = bindCollectionMiddleware;
