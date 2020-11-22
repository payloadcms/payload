/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

import webpack from 'webpack';
import getWebpackProdConfig from '../webpack/getWebpackProdConfig';
import findConfig from '../config/find';
import loadConfig from '../config/load';
import { buildConfig } from '../config/build';

const configPath = findConfig();

const build = () => {
  try {
    const unsanitizedConfig = loadConfig();
    const config = buildConfig(unsanitizedConfig);

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
          chunks: false,
          colors: true,
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


export default build;
