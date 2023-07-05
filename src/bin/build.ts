/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import webpack from 'webpack';
import getWebpackProdConfig from '../webpack/getProdConfig';
import loadConfig from '../config/load';

export const build = async (): Promise<void> => {
  const config = await loadConfig(); // Will throw its own error if it fails

  try {
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
    throw new Error('Error: there was an error building the webpack config.');
  }
};

// when build.js is launched directly
if (module.id === require.main.id) {
  build();
}
