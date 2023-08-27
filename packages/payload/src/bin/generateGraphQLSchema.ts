/* eslint-disable no-nested-ternary */
import fs from 'fs';
import { printSchema } from 'graphql';
import Logger from '../utilities/logger.js';
import loadConfig from '../config/load.js';
import payload from '../index.js';

export async function generateGraphQLSchema(): Promise<void> {
  const logger = Logger();
  const config = await loadConfig();

  config.db = null;

  await payload.init({
    secret: '--unused--',
    local: true,
  });

  logger.info('Compiling GraphQL schema...');
  fs.writeFileSync(config.graphQL.schemaOutputFile, printSchema(payload.schema));
  logger.info(`GraphQL written to ${config.graphQL.schemaOutputFile}`);
}

// when generateGraphQLSchema.js is launched directly
if (module.id === require.main.id) {
  generateGraphQLSchema();
}
