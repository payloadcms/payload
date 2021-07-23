/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import path from 'path';
import { Config } from './types';
import findConfig from './find';
import validate from './validate';
import babelConfig from '../babel.config';


const removedExtensions = ['.scss', '.css', '.svg', '.png', '.jpg', '.eot', '.ttf', '.woff', '.woff2'];

const loadConfig = (): Config => {
  const configPath = findConfig();

  removedExtensions.forEach((ext) => {
    require.extensions[ext] = () => null;
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('@babel/register')({
    ...babelConfig,
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    env: {
      development: {
        sourceMaps: 'inline',
        retainLines: true,
      },
    },
    ignore: [
      /node_modules[\\/](?!payload[\\/]dist[\\/]admin|payload[\\/]components).*/,
    ],
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  let config = require(configPath);

  if (config.default) config = config.default;

  const validatedConfig = validate(config);

  return {
    ...validatedConfig,
    paths: {
      ...(validatedConfig.paths || {}),
      configDir: path.dirname(configPath),
      config: configPath,
    },
  };
};

export default loadConfig;
