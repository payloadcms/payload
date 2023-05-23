/* eslint-disable no-nested-ternary */
import fs from 'fs';
import { printSchema } from 'graphql';
import Logger from '../utilities/logger';
import loadConfig from '../config/load';
import payload from '..';

export async function generateGraphQLSchema(): Promise<void> {
  const logger = Logger();
  const config = await loadConfig();

  process.env.PAYLOAD_DROP_DATABASE = 'true';

  await payload.init({
    secret: '--unused--',
    mongoURL: process.env.MONGO_URL || 'mongodb://127.0.0.1/payload',
    local: true,
  });

  logger.info('Compiling GraphQL schema...');
  fs.writeFileSync(config.graphQL.schemaOutputFile, printSchema(payload.schema));
  logger.info(`GraphQL written to ${config.graphQL.schemaOutputFile}`);
  process.exit(0);
}

// when generateGraphQLSchema.js is launched directly
if (module.id === require.main.id) {
  generateGraphQLSchema();
}
