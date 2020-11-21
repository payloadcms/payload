/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const webpack = require('webpack');
const getWebpackProdConfig = require('../webpack/getWebpackProdConfig');
const findConfig = require('../config/find');
const getConfig = require('../config/load');
const sanitizeConfig = require('../config/sanitize');

const configPath = findConfig();

const build = () => {
  try {
    const unsanitizedConfig = getConfig();
    const config = sanitizeConfig(unsanitizedConfig);

    const webpackProdConfig = getWebpackProdConfig({
      ...config,
      paths: {
        ...(config.paths || {}),
        config: configPath,
      },
    });

    webpack(webpackProdConfig, (err, stats) => { // Stats Object
      if (err || stats.hasErrors()) {
        // Handle errors here
        console.error(stats.toString({
          stats: 'errors-only',
        }));
      }
    });
  } catch (err) {
    console.error(err);
    console.error(`Error: can't find the configuration file located at ${configPath}.`);
  }
};

// when build.js is launched directly
if (module.id === require.main.id) {
  build();
}


module.exports = build;
