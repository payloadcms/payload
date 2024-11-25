import type { I18n } from '@payloadcms/translations'
import type {
  ClientConfig,
  ClientField,
  ClientFieldSchemaMap,
  FieldSchemaMap,
  Payload,
} from 'payload'

import { traverseFields } from './traverseFields.js'
/**
 * Flattens the config fields into a map of field schemas
 */
export const buildClientFieldSchemaMap = (args: {
  collectionSlug?: string
  config: ClientConfig
  globalSlug?: string
  i18n: I18n
  payload: Payload
  schemaMap: FieldSchemaMap
}): { clientFieldSchemaMap: ClientFieldSchemaMap } => {
  const { collectionSlug, config, globalSlug, i18n, payload, schemaMap } = args

  const clientSchemaMap: ClientFieldSchemaMap = new Map()

  if (collectionSlug) {
    const matchedCollection = config.collections.find(
      (collection) => collection.slug === collectionSlug,
    )

    if (matchedCollection) {
      if (matchedCollection.auth && !matchedCollection.auth.disableLocalStrategy) {
        // register schema with auth schemaPath
        const baseAuthFields: ClientField[] = [
          {
            name: 'password',
            type: 'text',
            label: i18n.t('general:password'),
            required: true,
          },
          {
            name: 'confirm-password',
            type: 'text',
            label: i18n.t('authentication:confirmPassword'),
            required: true,
          },
        ]

        clientSchemaMap.set(`_${matchedCollection.slug}.auth`, {
          fields: [...baseAuthFields, ...matchedCollection.fields],
        })
      }

      clientSchemaMap.set(collectionSlug, {
        fields: matchedCollection.fields,
      })

      traverseFields({
        clientSchemaMap,
        config,
        fields: matchedCollection.fields,
        i18n,
        parentIndexPath: '',
        parentSchemaPath: collectionSlug,
        payload,
        schemaMap,
      })
    }
  } else if (globalSlug) {
    const matchedGlobal = config.globals.find((global) => global.slug === globalSlug)

    if (matchedGlobal) {
      clientSchemaMap.set(globalSlug, {
        fields: matchedGlobal.fields,
      })

      traverseFields({
        clientSchemaMap,
        config,
        fields: matchedGlobal.fields,
        i18n,
        parentIndexPath: '',
        parentSchemaPath: globalSlug,
        payload,
        schemaMap,
      })
    }
  }

  return { clientFieldSchemaMap: clientSchemaMap }
}
