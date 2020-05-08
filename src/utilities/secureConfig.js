const deepCopyObject = require('../utilities/deepCopyObject');

const secureConfig = (config) => {
  const securedConfig = deepCopyObject(config);

  delete securedConfig.User.auth.secretKey;

  return securedConfig;
};

module.exports = secureConfig;
