import type { SanitizedConfig } from 'payload/types'

import type { FieldSchemaMap } from './types.js'

import { traverseFields } from './traverseFields.js'

export const buildFieldSchemaMap = (config: SanitizedConfig): FieldSchemaMap => {
  const result: FieldSchemaMap = new Map()

  const validRelationships = config.collections.map((c) => c.slug) || []

  config.collections.forEach((collection) => {
    traverseFields({
      config,
      fields: collection.fields,
      schemaMap: result,
      schemaPath: collection.slug,
      validRelationships,
    })
  })

  config.globals.forEach((global) => {
    traverseFields({
      config,
      fields: global.fields,
      schemaMap: result,
      schemaPath: global.slug,
      validRelationships,
    })
  })

  return result
}
