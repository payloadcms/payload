/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const path = require('path');
const webpack = require('webpack');

module.exports = (args) => {
  const configPath = path.resolve(process.cwd(), (args.config || './payload.config.js'));

  try {
    const config = require(configPath);
    console.log(config);
  } catch (err) {
    console.error(`Error: can't find the configuration file located at ${configPath}.`);
  }

  // Need to get the path to the config file if it's been passed as an arg to the build command
  // If it hasn't been passed, just check the root of the project
  // If not in either place, return an error
};
