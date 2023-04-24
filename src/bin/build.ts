/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import webpack from 'webpack';
import getWebpackProdConfig from '../webpack/getProdConfig';
import findConfig from '../config/find';
import loadConfig from '../config/load';

const rawConfigPath = findConfig();

export const build = async (): Promise<void> => {
  try {
    const config = await loadConfig();

    const webpackProdConfig = getWebpackProdConfig(config);

    webpack(webpackProdConfig, (err, stats) => { // Stats Object
      if (err || stats.hasErrors()) {
        // Handle errors here

        if (stats) {
          console.error(stats.toString({
            chunks: false,
            colors: true,
          }));
        } else {
          console.error(err.message);
        }
      }
    });
  } catch (err) {
    console.error(err);
    throw new Error(`Error: can't find the configuration file located at ${rawConfigPath}.`);
  }
};

// when build.js is launched directly
if (module.id === require.main.id) {
  build();
}
