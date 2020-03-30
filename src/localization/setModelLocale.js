const setModelLocaleMiddleware = () => {
  return (req, res, next) => {
    if (req.locale && req.model.setDefaultLocale) {
      req.model.setDefaultLocale(req.locale);
    }
    next();
  };
};

module.exports = setModelLocaleMiddleware;
