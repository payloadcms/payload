import type { I18n } from '@payloadcms/translations'
import type { SanitizedConfig } from 'payload'

import type { FieldSchemaMap } from './types.js'

import { traverseFields } from './traverseFields.js'

export const buildFieldSchemaMap = (args: {
  config: SanitizedConfig
  i18n: I18n
}): FieldSchemaMap => {
  const { config, i18n } = args

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
