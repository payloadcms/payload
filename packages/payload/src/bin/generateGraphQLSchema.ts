/* eslint-disable no-nested-ternary */
import { configToSchema } from '@payloadcms/graphql'
import fs from 'fs'
import { printSchema } from 'graphql'

import loadConfig from '../config/load'
import Logger from '../utilities/logger'

export async function generateGraphQLSchema(): Promise<void> {
  const logger = Logger()
  const config = await loadConfig()

  const { schema } = await configToSchema(config)

  logger.info('Compiling GraphQL schema...')
  fs.writeFileSync(config.graphQL.schemaOutputFile, printSchema(schema))
  logger.info(`GraphQL written to ${config.graphQL.schemaOutputFile}`)
}

// when generateGraphQLSchema.js is launched directly
if (module.id === require.main.id) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  generateGraphQLSchema()
}
