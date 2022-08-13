/* eslint-disable no-nested-ternary */
import fs from 'fs';
import { printSchema } from 'graphql';
import Logger from '../utilities/logger';
import loadConfig from '../config/load';
import payload from '..';

export function generateGraphQLSchema(): void {
  const logger = Logger();
  const config = loadConfig();
  const schemaOutputFile = process.env.PAYLOAD_GQL_OUTPUT_PATH || config.graphQL.schemaOutputFile;

  payload.init({
    secret: '--unused--',
    mongoURL: false,
    local: true,
  });

  logger.info('Compiling GraphQL schema...');
  fs.writeFileSync(schemaOutputFile, printSchema(payload.schema));
  logger.info(`GraphQL written to ${config.graphQL.schemaOutputFile}`);
}

// when generateGraphQLSchema.js is launched directly
if (module.id === require.main.id) {
  generateGraphQLSchema();
}
