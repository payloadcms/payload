import type { PayloadRequest } from 'payload/types'

import type { FieldSchemaMap } from './types.js'

import { traverseFields } from './traverseFields.js'

export const buildFieldSchemaMap = ({
  i18n,
  payload: { config },
}: PayloadRequest): FieldSchemaMap => {
  const result: FieldSchemaMap = new Map()

  const validRelationships = config.collections.map((c) => c.slug) || []

  config.collections.forEach((collection) => {
    traverseFields({
      config,
      fields: collection.fields,
      i18n,
      schemaMap: result,
      schemaPath: collection.slug,
      validRelationships,
    })
  })

  config.globals.forEach((global) => {
    traverseFields({
      config,
      fields: global.fields,
      i18n,
      schemaMap: result,
      schemaPath: global.slug,
      validRelationships,
    })
  })

  return result
}
