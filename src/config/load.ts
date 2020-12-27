/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import path from 'path';
import { Config } from './types';
import findConfig from './find';
import validate from './validate';

const removedExtensions = ['.scss', '.css', '.svg', '.png', '.jpg', '.eot', '.ttf', '.woff', '.woff2'];

const configPath = findConfig();

const loadConfig = (): Config => {
  removedExtensions.forEach((ext) => {
    require.extensions[ext] = () => null;
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
