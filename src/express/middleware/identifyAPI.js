const identifyAPI = (api) => {
  return (req, _, next) => {
    req.payloadAPI = api;
    next();
  };
};

module.exports = identifyAPI;
