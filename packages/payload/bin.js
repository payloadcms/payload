#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-var-requires */

import swcRegister from '@swc/register'
import { getTsconfig } from 'get-tsconfig'
import path from 'path'

import bin from './dist/bin/index.js'
import { loadEnv } from './dist/bin/loadEnv.js'
import findConfig from './dist/config/find.js'

const tsConfig = getTsconfig()

const swcOptions = {
  ignore: [/.*[\\/]node_modules[\\/].*/],
  jsc: {
    baseUrl: path.resolve('../../'),
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

loadEnv()
const configPath = findConfig()

const start = async () => {
  const sanitized = configPath.replace('.ts', '.js')
  const configPromise = await import(sanitized)
  const config = await configPromise

  bin(config)
}

start()
