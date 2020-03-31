const deepCopyObject = require('../utilities/deepCopyObject');

const secureConfig = (config) => {
  const securedConfig = deepCopyObject(config);

  delete securedConfig.user.auth.secretKey;

  return securedConfig;
};

module.exports = secureConfig;
