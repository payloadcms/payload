/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-var-requires */
import swcRegister from '@swc/register'
import { getTsconfig as getTSconfig } from 'get-tsconfig'
import minimist from 'minimist'
import path from 'path'

import type { BinScript } from '../config/types'

import loadConfig from '../config/load'
import { generateTypes } from './generateTypes'
import { loadEnv } from './loadEnv'
import { migrate } from './migrate'

loadEnv()

const tsConfig = getTSconfig()

const swcOptions = {
  ignore: [
    /.*[\\/]node_modules[\\/].*/, // parse everything besides files within node_modules
  ],
  jsc: {
    baseUrl: path.resolve(),
    parser: {
      syntax: 'typescript',
      tsx: true,
    },
    paths: undefined,
  },
  module: {
    type: 'commonjs',
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
  // @ts-ignore - bad @swc/register types
  swcRegister(swcOptions)
}

const executeBin = async () => {
  const args = minimist(process.argv.slice(2))
  const scriptIndex = args._.findIndex((x) => x === 'build')
  const script = scriptIndex === -1 ? args._[0] : args._[scriptIndex]
  const config = await loadConfig()
  const userBinScript = config.bin.find(({ key }) => key === script)

  if (userBinScript) {
    try {
      const script: BinScript = require(userBinScript.scriptPath)
      await script(config)
    } catch (err) {
      console.log(`Could not find associated bin script for the ${userBinScript.key} command`)
      console.error(err)
    }

    return
  }

  if (script.startsWith('migrate')) {
    migrate(args).then(() => process.exit(0))
  } else {
    switch (script.toLowerCase()) {
      case 'generate:types': {
        generateTypes(config)
        break
      }

      default:
        console.log(`Unknown script "${script}".`)
        break
    }
  }
}

executeBin()
