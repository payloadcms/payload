import type { I18nClient } from '@payloadcms/translations'
import type { Field, SanitizedConfig } from 'payload'

import { confirmPassword, password } from 'payload/shared'

import type { FieldSchemaMap } from './types.js'

import { traverseFields } from './traverseFields.js'

export const buildFieldSchemaMap = (args: {
  config: SanitizedConfig
  i18n: I18nClient
}): FieldSchemaMap => {
  const { config, i18n } = args

  const result: FieldSchemaMap = new Map()

  config.collections.forEach((collection) => {
    if (collection.auth && !collection.auth.disableLocalStrategy) {
      // register schema with auth schemaPath
      const baseAuthFields: Field[] = [
        {
          name: 'password',
          type: 'text',
          label: i18n.t('general:password'),
          required: true,
          validate: password,
        },
        {
          name: 'confirm-password',
          type: 'text',
          label: i18n.t('authentication:confirmPassword'),
          required: true,
          validate: confirmPassword,
        },
      ]

      result.set(`_${collection.slug}.auth`, [...collection.fields, ...baseAuthFields])
    }

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
