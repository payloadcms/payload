/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import path from 'path';
import webpack from 'webpack';
import esbuild from 'esbuild';
import getWebpackProdConfig from '../webpack/getProdConfig';
import findConfig from '../config/find';
import { dirnamePlugin } from '../config/dirnamePlugin';
import { builtConfigPath } from '../config/getBuiltConfigPath';
import { clientFiles } from '../config/clientFiles';

const rawConfigPath = findConfig();

export const build = async (): Promise<void> => {
  try {
    clientFiles.forEach((ext) => {
      require.extensions[ext] = () => null;
    });

    await esbuild.build({
      bundle: true,
      platform: 'node',
      outfile: builtConfigPath,
      entryPoints: [rawConfigPath],
      target: 'es2015',
      packages: 'external',
      plugins: [
        dirnamePlugin,
      ],
      loader: clientFiles.reduce((loaders, ext) => ({
        ...loaders,
        [ext]: 'empty',
      }), {
        '.js': 'jsx',
      }),
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
