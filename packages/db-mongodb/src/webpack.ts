import type { Webpack } from 'payload/database';

import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const _dirname = dirname(__filename);

export const webpack: Webpack = (config) => {
  return {
    ...config,
    resolve: {
      ...config.resolve || {},
      alias: {
        ...config.resolve?.alias || {},
        [path.resolve(_dirname, './index')]: path.resolve(_dirname, 'mock'),
      },
    },
  };
};
