import type { I18n } from '@payloadcms/translations'
import type { Field, FieldSchemaMap, SanitizedConfig } from 'payload'

import { confirmPassword, password } from 'payload/shared'

import { traverseFields } from './traverseFields.js'
/**
 * Flattens the config fields into a map of field schemas
 */
export const buildFieldSchemaMap = (args: {
  collectionSlug?: string
  config: SanitizedConfig
  globalSlug?: string
  i18n: I18n
}): { fieldSchemaMap: FieldSchemaMap } => {
  const { collectionSlug, config, globalSlug, i18n } = args

  const schemaMap: FieldSchemaMap = new Map()

  if (collectionSlug) {
    const matchedCollection = config.collections.find(
      (collection) => collection.slug === collectionSlug,
    )

    if (matchedCollection) {
      if (matchedCollection.auth && !matchedCollection.auth.disableLocalStrategy) {
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

        schemaMap.set(`_${matchedCollection.slug}.auth`, {
          fields: [...baseAuthFields, ...matchedCollection.fields],
        })
      }

      schemaMap.set(collectionSlug, {
        fields: matchedCollection.fields,
      })

      traverseFields({
        config,
        fields: matchedCollection.fields,
        i18n,
        parentIndexPath: '',
        parentSchemaPath: collectionSlug,
        schemaMap,
      })
    }
  } else if (globalSlug) {
    const matchedGlobal = config.globals.find((global) => global.slug === globalSlug)

    if (matchedGlobal) {
      schemaMap.set(globalSlug, {
        fields: matchedGlobal.fields,
      })

      traverseFields({
        config,
        fields: matchedGlobal.fields,
        i18n,
        parentIndexPath: '',
        parentSchemaPath: globalSlug,
        schemaMap,
      })
    }
  }

  return { fieldSchemaMap: schemaMap }
}
