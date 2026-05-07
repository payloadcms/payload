/* eslint-disable no-console */
import minimist from 'minimist'
import { pathToFileURL } from 'node:url'
import { findConfig, loadEnv } from 'payload/node'

import { generateSchema } from './generateSchema.js'

export const bin = async () => {
  const args = minimist(process.argv.slice(2))
  const script = (typeof args._[0] === 'string' ? args._[0] : '').toLowerCase()

  // `migrate` runs against the user's source files and does not require loading
  // their Payload config (which may itself be broken pre-migration).
  if (script === 'migrate') {
    await import('./migrate.js')
    return
  }

  loadEnv()
  const configPath = findConfig()
  const config = await (await import(pathToFileURL(configPath).toString())).default

  if (script === 'generate:schema') {
    return generateSchema(config)
  }

  console.log(`Unknown script: "${script}".`)
  console.log('Available: generate:schema, migrate')
  process.exit(1)
}
