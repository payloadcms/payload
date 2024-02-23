import { configToSchema } from '@payloadcms/graphql'
import fs from 'fs'
import { printSchema } from 'graphql'

import type { SanitizedConfig } from '../config/types'

import loadConfig from '../config/load'
import Logger from '../utilities/logger'

export async function generateGraphQLSchema(config: SanitizedConfig): Promise<void> {
  const logger = Logger()

  const { schema } = await configToSchema(config)

  logger.info('Compiling GraphQL schema...')
  fs.writeFileSync(config.graphQL.schemaOutputFile, printSchema(schema))
  logger.info(`GraphQL written to ${config.graphQL.schemaOutputFile}`)
}

// when generateGraphQLSchema.js is launched directly
if (module.id === require.main.id) {
  const loadConfigAndGenerateSchema = async () => {
    const config = await loadConfig()
    await generateGraphQLSchema(config)
  }

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  loadConfigAndGenerateSchema()
}
