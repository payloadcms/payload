/* eslint-disable no-nested-ternary */
import fs from 'fs'
import { printSchema } from 'graphql'

import payload from '..'
import loadConfig from '../config/load'
import Logger from '../utilities/logger'

export async function generateGraphQLSchema(): Promise<void> {
  const logger = Logger()
  const config = await loadConfig()

  config.db = null

  await payload.init({
    disableDBConnect: true,
    disableOnInit: true,
    local: true,
    secret: '--unused--',
  })

  logger.info('Compiling GraphQL schema...')
  fs.writeFileSync(config.graphQL.schemaOutputFile, printSchema(payload.schema))
  logger.info(`GraphQL written to ${config.graphQL.schemaOutputFile}`)
}

// when generateGraphQLSchema.js is launched directly
if (module.id === require.main.id) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  generateGraphQLSchema()
}
