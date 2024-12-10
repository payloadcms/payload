/* eslint-disable no-console */
import minimist from 'minimist'
import { pathToFileURL } from 'node:url'
import { findConfig, loadEnv } from 'payload/node'

import { generateSchema } from './generateSchema.js'

export const bin = async () => {
  loadEnv()
  const configPath = findConfig()
  const config = await (await import(pathToFileURL(configPath).toString())).default

  const args = minimist(process.argv.slice(2))
  const script = (typeof args._[0] === 'string' ? args._[0] : '').toLowerCase()

  if (script === 'generate:schema') {
    return generateSchema(config)
  }

  console.log(`Unknown script: "${script}".`)
  process.exit(1)
}
