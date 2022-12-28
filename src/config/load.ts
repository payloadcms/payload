/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
// eslint-disable-next-line import/no-extraneous-dependencies
import swcRegister from '@swc/register';
import path from 'path';
import pino from 'pino';
import Logger from '../utilities/logger';
import { SanitizedConfig } from './types';
import findConfig from './find';
import validate from './validate';
import { clientFiles } from './clientFiles';

const loadConfig = (logger?: pino.Logger): SanitizedConfig => {
  const localLogger = logger ?? Logger();

  const configPath = findConfig();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  swcRegister({
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
      },
    },
    module: {
      type: 'commonjs',
    },
  });

  clientFiles.forEach((ext) => {
    require.extensions[ext] = () => null;
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  let config = require(configPath);

  if (config.default) config = config.default;

  let validatedConfig = config;

  if (process.env.NODE_ENV !== 'production') {
    validatedConfig = validate(config, localLogger);
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
