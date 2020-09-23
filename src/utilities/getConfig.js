/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const findConfig = require('./findConfig');

const configPath = findConfig();
const babelConfig = require('../../babel.config');

require('ignore-styles');

if (process.env.NODE_ENV !== 'test') {
  require('@babel/register')({
    ...babelConfig,
    ignore: [
      /node_modules\/(?!@payloadcms\/payload\/src\/client|@payloadcms\/payload\/admin).*/,
    ],
  });
}

const getConfig = () => {
  const publicConfig = require(configPath);

  return {
    ...publicConfig,
    paths: {
      configDir: configPath.substring(0, configPath.lastIndexOf('/')),
      ...(publicConfig.paths || {}),
      config: configPath,
    },
  };
};

module.exports = getConfig;
