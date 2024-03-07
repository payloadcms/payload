#!/usr/bin/env node

const { getTsconfig } = require('get-tsconfig')
const path = require('path')
const swcRegister = require('@swc/register')

const tsConfig = getTsconfig()

const swcOptions = {
  ignore: [/.*[\\/]node_modules[\\/].*/],
  jsc: {
    baseUrl: path.resolve(),
    parser: {
      syntax: 'typescript',
      tsx: true,
    },
    paths: undefined,
  },
  module: {
    type: 'es6',
  },
  sourceMaps: 'inline',
}
if (tsConfig?.config?.compilerOptions?.paths) {
  swcOptions.jsc.paths = tsConfig.config.compilerOptions.paths
  if (tsConfig?.config?.compilerOptions?.baseUrl) {
    swcOptions.jsc.baseUrl = path.resolve(tsConfig.config.compilerOptions.baseUrl)
  }
}
// Allow disabling SWC for debugging
if (process.env.DISABLE_SWC !== 'true') {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error - bad @swc/register types
  swcRegister(swcOptions)
}

const bin = async () => {
  await import('./dist/bin/index.js')
}

bin()
