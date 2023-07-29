import path from 'path';
import type { Webpack } from '../../types';

export const webpack: Webpack = (config) => ({
  ...config,
  resolve: {
    ...config.resolve || {},
    alias: {
      ...config.resolve?.alias || {},
      [path.resolve(__filename)]: path.resolve(__dirname, 'mock.js'),
    },
  },
});
