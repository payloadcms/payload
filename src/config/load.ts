/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
// eslint-disable-next-line import/no-extraneous-dependencies
import path from 'path';
import pino from 'pino';
import Logger from '../utilities/logger';
import { SanitizedConfig } from './types';
import findConfig from './find';
import validate from './validate';
import { clientFiles } from './clientFiles';

const loadConfig = async (logger?: pino.Logger): Promise<SanitizedConfig> => {
  const localLogger = logger ?? Logger();

  const configPath = findConfig();

  clientFiles.forEach((ext) => {
    require.extensions[ext] = () => null;
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  let config = await require(configPath);

  if (config.default) config = config.default;

  let validatedConfig = await Promise.resolve(config);

  if (process.env.NODE_ENV !== 'production') {
    validatedConfig = await validate(validatedConfig, localLogger);
  }

  return {
    ...validatedConfig,
    paths: {
      configDir: path.dirname(configPath),
      config: configPath,
      rawConfig: configPath,
    },
  };
};

export default loadConfig;
