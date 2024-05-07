/* eslint-disable no-console */
import minimist from 'minimist'
import { findConfig } from 'payload/config'

import { generateSchema } from './generateSchema.js'
import { loadEnv } from './loadEnv.js'

export const bin = async () => {
  loadEnv()
  const configPath = findConfig()
  const configPromise = await import(configPath)
  let config = await configPromise
  if (config.default) config = await config.default

  const args = minimist(process.argv.slice(2))
  const script = (typeof args._[0] === 'string' ? args._[0] : '').toLowerCase()

  if (script === 'generate:schema') {
    return generateSchema(config)
  }

  console.log(`Unknown script: "${script}".`)
  process.exit(1)
}
