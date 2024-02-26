import type { SanitizedConfig } from 'payload/types'

import type { FieldSchemaMap } from './types'

import { traverseFields } from './traverseFields'

export const buildFieldSchemaMap = (config: SanitizedConfig): FieldSchemaMap => {
  const result: FieldSchemaMap = new Map()

  config.collections.forEach((collection) => {
    traverseFields({
      config,
      fields: collection.fields,
      schemaMap: result,
      schemaPath: collection.slug,
    })
  })

  config.globals.forEach((global) => {
    traverseFields({
      config,
      fields: global.fields,
      schemaMap: result,
      schemaPath: global.slug,
    })
  })

  return result
}
