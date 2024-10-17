import type { I18n } from '@payloadcms/translations'
import type {
  ClientConfig,
  ClientFieldSchemaMap,
  Field,
  FieldSchemaMap,
  SanitizedConfig,
} from 'payload'

import { confirmPassword, password } from 'payload/shared'

import { traverseFields } from './traverseFields.js'

export const buildFieldSchemaMap = (args: {
  clientConfig?: ClientConfig
  config: SanitizedConfig
  i18n: I18n
}): { clientSchemaMap: ClientFieldSchemaMap; fieldSchemaMap: FieldSchemaMap } => {
  const { clientConfig, config, i18n } = args

  const schemaMap: FieldSchemaMap = new Map()
  const clientSchemaMap: ClientFieldSchemaMap = new Map()

  config.collections.forEach((collection, i) => {
    const clientCollection = clientConfig?.collections?.[i]

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

      schemaMap.set(`_${collection.slug}.auth`, [...collection.fields, ...baseAuthFields])
      clientSchemaMap.set(`_${clientCollection?.slug}.auth`, clientCollection?.fields)
    }

    traverseFields({
      config,
      fields: collection.fields,
      i18n,
      schemaMap,
      schemaPath: collection.slug,
    })
  })

  config.globals.forEach((global) => {
    traverseFields({
      config,
      fields: global.fields,
      i18n,
      schemaMap,
      schemaPath: global.slug,
    })
  })

  return { clientSchemaMap, fieldSchemaMap: schemaMap }
}
