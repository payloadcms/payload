/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import path from 'path';
import { Config } from './types';
import findConfig from './find';

const configPath = findConfig();
const loadConfig = (): Config => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  let publicConfig = require(configPath);

  if (publicConfig.default) publicConfig = publicConfig.default;

  return {
    ...publicConfig,
    paths: {
      ...(publicConfig.paths || {}),
      configDir: path.dirname(configPath),
      config: configPath,
    },
  };
};

export default loadConfig;
