/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const webpack = require('webpack');
const getWebpackProdConfig = require('../webpack/getWebpackProdConfig');
const findConfig = require('../utilities/findConfig');
const getConfig = require('../utilities/getConfig');
const sanitizeConfig = require('../utilities/sanitizeConfig');

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
        console.log(err);
      }

      console.log(stats.toString({
        chunks: false, // Makes the build much quieter
        colors: true, // Shows colors in the console
      }));
      // Done processing
    });
  } catch (err) {
    console.log(err);
    console.error(`Error: can't find the configuration file located at ${configPath}.`);
  }
};

// when build.js is launched directly
if (module.id === require.main.id) {
  build();
}


module.exports = build;
