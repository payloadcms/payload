import type { SanitizedConfig } from 'payload/types'

import type { FieldSchemaMap } from './types.js'

import { traverseFields } from './traverseFields.js'

export const buildFieldSchemaMap = async (config: SanitizedConfig): Promise<FieldSchemaMap> => {
  const result: FieldSchemaMap = new Map()

  const validRelationships = config.collections.map((c) => c.slug) || []

  await Promise.all(
    config.collections.map(async (collection) => {
      await traverseFields({
        config,
        fields: collection.fields,
        schemaMap: result,
        schemaPath: collection.slug,
        validRelationships,
      })
    }),
  )

  await Promise.all(
    config.globals.map(async (global) => {
      await traverseFields({
        config,
        fields: global.fields,
        schemaMap: result,
        schemaPath: global.slug,
        validRelationships,
      })
    }),
  )

  return result
}
