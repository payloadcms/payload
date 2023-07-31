import path from 'path';
import type { Webpack } from 'payload/dist/database/types';

export const webpack: Webpack = (config) => {
  return {
    ...config,
    resolve: {
      ...config.resolve || {},
      alias: {
        ...config.resolve?.alias || {},
        [path.resolve(__dirname, './index')]: path.resolve(__dirname, 'mock'),
      },
    },
  };
};
