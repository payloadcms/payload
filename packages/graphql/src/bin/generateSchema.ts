import type { SanitizedConfig } from 'payload'

import fs from 'fs'
import { lexicographicSortSchema, printSchema } from 'graphql'

import { configToSchema } from '../index.js'

type GenerateSchemaOptions = {
  sortSchema?: boolean
}

export function generateSchema(config: SanitizedConfig, options: GenerateSchemaOptions = {}): void {
  const outputFile = process.env.PAYLOAD_GRAPHQL_SCHEMA_PATH || config.graphQL.schemaOutputFile

  const { schema } = configToSchema(config)

  const shouldSortSchema = options.sortSchema ?? false
  const schemaToPrint = shouldSortSchema ? lexicographicSortSchema(schema) : schema

  fs.writeFileSync(outputFile, printSchema(schemaToPrint))
}
