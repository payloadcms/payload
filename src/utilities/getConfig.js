/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */

const getConfig = (options) => {
  if (!options.config || !options.config.public || !options.config.private) {
    throw new Error('Error: missing config paths. Please specify where to find your configuration files while initializing Payload.');
  }

  const publicConfig = require(options.config.public);
  const privateConfig = require(options.config.private);

  return {
    ...publicConfig,
    ...privateConfig,
  };
};

module.exports = getConfig;
