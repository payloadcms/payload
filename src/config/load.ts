/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import path from 'path';
import { Config } from './types';
import findConfig from './find';

const configPath = findConfig();
const getConfig = (): Config => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const publicConfig = require(configPath);
  return {
    ...publicConfig,
    paths: {
      configDir: path.dirname(configPath),
      ...(publicConfig.paths || {}),
      config: configPath,
    },
  };
};

export default getConfig;
