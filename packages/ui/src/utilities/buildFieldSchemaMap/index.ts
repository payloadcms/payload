import type { I18n } from '@payloadcms/translations'
import type { Field, FieldSchemaMap, SanitizedConfig, TextField } from 'payload'

import { confirmPassword, password } from 'payload/shared'

import { traverseFields } from './traverseFields.js'

const baseAuthFields: Field[] = [
  {
    name: 'password',
    type: 'text',
    required: true,
    validate: password,
  },
  {
    name: 'confirm-password',
    type: 'text',
    required: true,
    validate: confirmPassword,
  },
]

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
      let fieldsToSet = matchedCollection?.fields || []

      if (matchedCollection.auth && !matchedCollection.auth.disableLocalStrategy) {
        ;(baseAuthFields[0] as TextField).label = i18n.t('general:password')
        ;(baseAuthFields[1] as TextField).label = i18n.t('authentication:confirmPassword')
        // Place these fields _last_ to ensure they do not disrupt field paths in the field schema map
        fieldsToSet = fieldsToSet.concat(baseAuthFields)
      }

      schemaMap.set(collectionSlug, {
        fields: fieldsToSet,
      })

      traverseFields({
        config,
        fields: fieldsToSet,
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
