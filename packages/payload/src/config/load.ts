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
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const loadConfig = async (logger?: pino.Logger): Promise<SanitizedConfig> => {
  const localLogger = logger ?? Logger();

  const configPath = findConfig();

  clientFiles.forEach((ext) => {
    require.extensions[ext] = () => null;
  });

  const configPromise = await import(configPath);

  let config = await configPromise;

  if (config.default) config = await config.default;

  if (process.env.NODE_ENV !== 'production') {
    config = await validate(config, localLogger);
  }

  return {
    ...config,
    paths: {
      configDir: path.dirname(configPath),
      config: configPath,
      rawConfig: configPath,
    },
  };
};

export default loadConfig;
