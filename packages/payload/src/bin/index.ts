import minimist from 'minimist'

import type { BinScript } from '../config/types'

import loadConfig from '../config/load'
import { generateTypes } from './generateTypes'
import { loadEnv } from './loadEnv'
import { migrate } from './migrate'

loadEnv()

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
