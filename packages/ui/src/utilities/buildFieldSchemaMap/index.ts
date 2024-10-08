import type { I18nClient } from '@payloadcms/translations'
import type { FieldSchemaMap, SanitizedConfig } from 'payload'

import { traverseFields } from './traverseFields.js'

export const buildFieldSchemaMap = (args: {
  config: SanitizedConfig
  i18n: I18nClient
}): FieldSchemaMap => {
  const { config, i18n } = args

  const result: FieldSchemaMap = new Map()

  config.collections.forEach((collection) => {
    traverseFields({
      config,
      fields: collection.fields,
      i18n,
      schemaMap: result,
      schemaPath: collection.slug,
    })
  })

  config.globals.forEach((global) => {
    traverseFields({
      config,
      fields: global.fields,
      i18n,
      schemaMap: result,
      schemaPath: global.slug,
    })
  })

  return result
}
