import type { Configuration as WebpackConfig } from 'webpack'

import findNodeModules from 'find-node-modules'
import fs from 'fs'
import path from 'path'

const packageName = '@payloadcms/plugin-cloud-storage'

const nodeModulesPaths = findNodeModules({ cwd: __dirname, relative: false })

export const extendWebpackConfig = (existingWebpackConfig: WebpackConfig): WebpackConfig => {
  let nodeModulesPath = nodeModulesPaths.find((p) => {
    const guess = path.resolve(p, `${packageName}/dist`)

    if (fs.existsSync(guess)) {
      return true
    }
    return false
  })

  if (!nodeModulesPath) {
    nodeModulesPath = process.cwd()
  }

  const newConfig: WebpackConfig = {
    ...existingWebpackConfig,
    resolve: {
      ...(existingWebpackConfig.resolve || {}),
      alias: {
        ...(existingWebpackConfig.resolve?.alias ? existingWebpackConfig.resolve.alias : {}),
        '@payloadcms/plugin-cloud-storage/s3$': path.resolve(
          nodeModulesPath,
          `./${packageName}/dist/adapters/s3/mock.js`,
        ),
      },
      fallback: {
        ...(existingWebpackConfig.resolve?.fallback ? existingWebpackConfig.resolve.fallback : {}),
        stream: false,
      },
    },
  }

  return newConfig
}
