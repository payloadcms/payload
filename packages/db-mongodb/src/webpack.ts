import path from 'path';
import type { Webpack } from '../../../types'; // Need to export this

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
