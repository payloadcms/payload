import type { I18n } from '@payloadcms/translations'
import type { ClientConfig, Field, FieldMap, SanitizedConfig } from 'payload'

import { confirmPassword, password } from 'payload/shared'

import { traverseFields } from './traverseFields.js'

export const buildFieldMap = (args: {
  clientConfig?: ClientConfig
  config: SanitizedConfig
  i18n: I18n
}): FieldMap => {
  const { clientConfig, config, i18n } = args

  const fieldMap: FieldMap = new Map()

  config.collections.forEach((collection) => {
    const clientCollectionConfig = clientConfig?.collections.find(
      (clientCollection) => clientCollection.slug === collection.slug,
    )

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

      ;[...collection.fields, ...baseAuthFields].forEach((field) => {
        if ('name' in field) {
          fieldMap.set(`_${collection.slug}.auth.${field.name}`, { field })
        }
      })
    }

    traverseFields({
      clientFields: clientCollectionConfig?.fields || [],
      config,
      fieldMap,
      fields: collection.fields,
      i18n,
      schemaPath: collection.slug,
    })
  })

  config.globals.forEach((global) => {
    const clientGlobalConfig = clientConfig?.globals.find(
      (clientGlobal) => clientGlobal.slug === global.slug,
    )

    traverseFields({
      clientFields: clientGlobalConfig?.fields || [],
      config,
      fieldMap,
      fields: global.fields,
      i18n,
      schemaPath: global.slug,
    })
  })

  return fieldMap
}
