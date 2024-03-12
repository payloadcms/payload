/* eslint-disable no-console */
import minimist from 'minimist'

import type { BinScript } from '../config/types.js'

import { findConfig } from '../config/find.js'
import { generateTypes } from './generateTypes.js'
import { loadEnv } from './loadEnv.js'
import { migrate } from './migrate.js'

export const bin = async () => {
  loadEnv()
  const configPath = findConfig()
  const configPromise = await import(configPath)
  let config = await configPromise
  if (config.default) config = await config.default

  const args = minimist(process.argv.slice(2))
  const script = (typeof args._[0] === 'string' ? args._[0] : '').toLowerCase()

  const userBinScript = Array.isArray(config.bin)
    ? config.bin.find(({ key }) => key === script)
    : false

  if (userBinScript) {
    try {
      const script: BinScript = await import(userBinScript.scriptPath)
      await script(config)
    } catch (err) {
      console.log(`Could not find associated bin script for the ${userBinScript.key} command`)
      console.error(err)
    }

    return
  }

  if (script.startsWith('migrate')) {
    return migrate({ config, parsedArgs: args }).then(() => process.exit(0))
  }

  if (script === 'generate:types') {
    return generateTypes(config)
  }

  console.log(`Unknown script: "${script}".`)
  process.exit(1)
}
