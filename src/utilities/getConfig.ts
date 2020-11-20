/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
import path from 'path';
import findConfig from './findConfig';

const configPath = findConfig();
const getConfig = () => {
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
