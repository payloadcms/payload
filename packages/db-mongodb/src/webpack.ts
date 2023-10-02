import type { Webpack } from 'payload/database'

import path from 'path'

export const webpack: Webpack = (config) => {
  const aliasPath = path.resolve(__dirname, 'mock.js')

  return {
    ...config,
    resolve: {
      ...(config.resolve || {}),
      alias: {
        ...(config.resolve?.alias || {}),
        '@payloadcms/db-mongodb': aliasPath,
        [path.resolve(__dirname, './index')]: aliasPath,
      },
    },
  }
}
