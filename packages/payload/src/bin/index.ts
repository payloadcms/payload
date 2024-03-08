/* eslint-disable no-console */
import minimist from 'minimist'

import type { BinScript, SanitizedConfig } from '../config/types.js'

// import loadConfig from '../config/load.js'
import { generateTypes } from './generateTypes.js'
import { migrate } from './migrate.js'

// eslint-disable-next-line no-restricted-exports
export default async (config: SanitizedConfig) => {
  const args = minimist(process.argv.slice(2))
  const scriptIndex = args._.findIndex((x) => x === 'build')
  const script = scriptIndex === -1 ? args._[0] : args._[scriptIndex]
  const userBinScript = config.bin.find(({ key }) => key === script)

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
    void migrate({ config, parsedArgs: args }).then(() => process.exit(0))
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
