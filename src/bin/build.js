/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const path = require('path');
const webpack = require('webpack');
const getWebpackProdConfig = require('../client/config/getWebpackProdConfig');

module.exports = (args) => {
  const configPath = path.resolve(process.cwd(), (args.config || './payload.config.js'));

  try {
    const config = require(configPath);
    const webpackProdConfig = getWebpackProdConfig(config);
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
    console.error(`Error: can't find the configuration file located at ${configPath}.`);
  }

  // Need to get the path to the config file if it's been passed as an arg to the build command
  // If it hasn't been passed, just check the root of the project
  // If not in either place, return an error
};
