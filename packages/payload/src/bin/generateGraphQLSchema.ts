/* eslint-disable no-nested-ternary */
import fs from 'fs'
import { printSchema } from 'graphql'
import * as url from 'node:url'

import loadConfig from '../config/load.js'
import payload from '../index.js'
import Logger from '../utilities/logger.js'

export async function generateGraphQLSchema(): Promise<void> {
  const logger = Logger()
  const config = await loadConfig()

  config.db = null

  await payload.init({
    local: true,
    secret: '--unused--',
  })

  logger.info('Compiling GraphQL schema...')
  fs.writeFileSync(config.graphQL.schemaOutputFile, printSchema(payload.schema))
  logger.info(`GraphQL written to ${config.graphQL.schemaOutputFile}`)
}

let isMainModule = false

if (typeof module !== 'undefined' && module) {
  //CJS
  if (module.id === require.main.id) {
    isMainModule = true
  }
} else {
  // ESM
  // This is an ESM translation from Rich Harris https://2ality.com/2022/07/nodejs-esm-main.html
  if (import.meta.url.startsWith('file:')) {
    // (A)
    const modulePath = url.fileURLToPath(import.meta.url)
    if (process.argv[1] === modulePath) {
      isMainModule = true
    }
  }
}

// when generateGraphQLSchema.js is launched directly
if (isMainModule) {
  generateGraphQLSchema()
}
