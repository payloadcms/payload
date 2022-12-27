/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import path from 'path';
import esbuild from 'esbuild';
import pino from 'pino';
import Logger from '../utilities/logger';
import { SanitizedConfig } from './types';
import findConfig from './find';
import validate from './validate';
import { builtConfigPath } from './getBuiltConfigPath';

const clientFiles = ['.scss', '.css', '.svg', '.png', '.jpg', '.eot', '.ttf', '.woff', '.woff2'];

const loadConfig = (logger?: pino.Logger): SanitizedConfig => {
  const localLogger = logger ?? Logger();

  const rawConfigPath = findConfig();

  if (process.env.NODE_ENV !== 'production') {
    esbuild.buildSync({
      bundle: true,
      platform: 'node',
      outfile: builtConfigPath,
      entryPoints: [rawConfigPath],
      target: 'es2015',
      packages: 'external',
      loader: clientFiles.reduce((loaders, ext) => ({
        ...loaders,
        [ext]: 'empty',
      }), {}),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  let config = require(builtConfigPath);

  if (config.default) config = config.default;

  let validatedConfig = config;

  if (process.env.NODE_ENV !== 'production') {
    validatedConfig = validate(config, localLogger);
  }

  return {
    ...validatedConfig,
    paths: {
      configDir: path.dirname(builtConfigPath),
      config: builtConfigPath,
      rawConfig: rawConfigPath,
    },
  };
};

export default loadConfig;
