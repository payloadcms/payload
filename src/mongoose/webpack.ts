import path from 'path';

export const webpack = (config) => ({
  ...config,
  resolve: {
    ...config.resolve || {},
    alias: {
      ...config.resolve?.alias || {},
      [path.resolve(__filename)]: path.resolve(__dirname, 'mock.js'),
    },
  },
});
