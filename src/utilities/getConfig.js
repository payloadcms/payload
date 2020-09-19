const findConfig = require('./findConfig');

/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */

const getConfig = (options = {}) => {
  if (!options.secret) {
    throw new Error('Error: missing secret key. A secret key is needed to secure Payload.');
  }

  if (!options.mongoURL) {
    throw new Error('Error: missing MongoDB connection URL.');
  }

  const configPath = findConfig();
  const publicConfig = require(configPath);
  const email = { ...(publicConfig.email || {}), ...(options.email || {}) };

  return {
    ...publicConfig,
    secret: options.secret,
    mongoURL: options.mongoURL,
    email,
    paths: {
      configDir: configPath.substring(0, configPath.lastIndexOf('/')),
      ...(publicConfig.paths || {}),
      config: configPath,
    },
  };
};

module.exports = getConfig;
