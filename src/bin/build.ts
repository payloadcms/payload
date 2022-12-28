/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import path from 'path';
import { bundle } from '@swc/core';
import webpack from 'webpack';
import getWebpackProdConfig from '../webpack/getProdConfig';
import findConfig from '../config/find';
import { builtConfigPath } from '../config/getBuiltConfigPath';

const rawConfigPath = findConfig();

export const build = async (): Promise<void> => {
  try {
    await bundle({
      target: 'node',
      entry: {
        config: rawConfigPath,
      },
      output: {
        name: 'config',
        path: builtConfigPath,
      },
      module: {
        type: 'commonjs',
      },
      externalModules: [
        'node_modules/*',
      ],
    });

    // eslint-disable-next-line import/no-dynamic-require
    let incomingConfig = require(builtConfigPath);

    if (incomingConfig.default) incomingConfig = incomingConfig.default;

    const config = {
      ...incomingConfig,
      paths: {
        configDir: path.dirname(builtConfigPath),
        config: builtConfigPath,
        rawConfig: rawConfigPath,
      },
    };

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
