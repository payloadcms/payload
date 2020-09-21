/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const findConfig = require('./findConfig');

const configPath = findConfig();

require('ignore-styles');
require('@babel/register')({
  presets: [
    [
      '@babel/preset-env',
      {
        targets: [
          'defaults',
          'not IE 11',
          'not IE_Mob 11',
          'maintained node versions',
        ],
      },
    ],
    '@babel/preset-react',
  ],
  plugins: [
    ['module-resolver', {
      alias: {
        'payload/unsanitizedConfig': configPath,
        '@payloadcms/payload$': '../',
      },
    }],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-optional-chaining',
    'add-module-exports',
  ],
  ignore: [
    '*.scss',
    '*.css',
    'node_modules',
  ],
});

const getConfig = (options = {}) => {
  if (!options.secret) {
    throw new Error('Error: missing secret key. A secret key is needed to secure Payload.');
  }

  if (!options.mongoURL) {
    throw new Error('Error: missing MongoDB connection URL.');
  }

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
