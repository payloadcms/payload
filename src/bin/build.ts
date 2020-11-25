/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

import webpack from 'webpack';
import getWebpackProdConfig from '../webpack/getWebpackProdConfig';
import findConfig from '../config/find';
import loadConfig from '../config/load';
import getBabelConfig from '../babel.config';

const babelConfig = getBabelConfig({
  env: () => false,
});

const configPath = findConfig();

const build = (): void => {
  try {
    require('@babel/register')({
      ...babelConfig,
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      plugins: [
        [
          require('babel-plugin-ignore-html-and-css-imports'),
          {
            removeExtensions: ['.svg', '.css', '.scss', '.png', '.jpg'],
          },
        ],
        ...babelConfig.plugins,
      ],
    });

    const config = loadConfig();

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
