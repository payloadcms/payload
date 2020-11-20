/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const path = require('path');
const findConfig = require('./findConfig');

const configPath = findConfig();
const babelConfig = require('../../babel.config');

require('ignore-styles');

const getConfig = () => {
  const publicConfig = require(configPath);
  return {
    ...publicConfig,
    paths: {
      configDir: path.dirname(configPath),
      ...(publicConfig.paths || {}),
      config: configPath,
    },
  };
};

module.exports = getConfig;
