const secureConfig = (config) => {
  const securedConfig = { ...config };

  delete securedConfig.user.auth.secretKey;

  return securedConfig;
};

module.exports = secureConfig;
