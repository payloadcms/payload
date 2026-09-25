import { fromJsonSchema, type StandardSchemaWithJSON } from '@modelcontextprotocol/server'

import type { ToolInputSchema } from '../types.js'

/** Normalize a tool/prompt input to a Standard Schema. Raw JSON Schema gets wrapped; Standard Schema instances pass through. */
export const toStandardSchema = (schema: ToolInputSchema): StandardSchemaWithJSON =>
  typeof schema === 'object' && schema !== null && '~standard' in schema
    ? (schema as StandardSchemaWithJSON)
    : fromJsonSchema(schema)
