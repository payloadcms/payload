import minimist from 'minimist'

const args = minimist(process.argv.slice(2))
const scriptIndex = args._.findIndex((x) => x === 'install')
const script = scriptIndex === -1 ? args._[0] : args._[scriptIndex]

const { debug } = args

import { install } from './install'

main()

async function main() {
  if (debug) console.log({ pwd: process.cwd(), debug })
  switch (script.toLowerCase()) {
    case 'install': {
      if (debug) console.log('Running install')
      await install({ debug })
      break
    }

    default:
      console.log(`Unknown script "${script}".`)
      break
  }
}
