const path = require('path');
const fs = require('fs');

/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */

const getConfig = (options = {}) => {
  if (!options.secret) {
    throw new Error('Error: missing secret key. A secret key is needed to secure Payload.');
  }

  if (!options.mongoURL) {
    throw new Error('Error: missing MongoDB connection URL.');
  }

  let configPath = path.resolve(__dirname, '../../../payload.config.js');

  if (!fs.existsSync(configPath)) {
    if (typeof options.config !== 'string') {
      throw new Error('Error: cannot find Payload config. Please create a configuration file located at the root of your project called "payload.config.js".');
    }

    if (fs.existsSync(options.config)) {
      configPath = options.config;
    }
  }

  const publicConfig = require(configPath);

  return {
    ...publicConfig,
    secret: options.secret,
    mongoURL: options.mongoURL,
    email: options.email,
    paths: {
      ...publicConfig.paths,
      config: configPath,
    },
  };
};

module.exports = getConfig;
