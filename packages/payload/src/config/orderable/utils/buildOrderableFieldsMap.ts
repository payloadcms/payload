import { status as httpStatus } from 'http-status'

import type { CollectionConfig } from '../../../collections/config/types.js'
import type { SanitizedConfig } from '../../types.js'

import { APIError } from '../../../errors/index.js'
import { traverseFields } from '../../../utilities/traverseFields.js'

export type OrderableFieldConfig = {
  joinOnFieldPath?: string
  name: string
}

/**
 * Builds a map of collections to orderable field names that must be added.
 *
 * It scans `collection.orderable` and orderable `join` fields, applies default
 * sort values, and returns all generated order field names grouped by the
 * target collection where each field is persisted.
 */
export function buildOrderableFieldsMap(config: SanitizedConfig): {
  fieldsToAdd: Map<CollectionConfig, OrderableFieldConfig[]>
  joinFieldPathsByCollection: Map<string, Map<string, string>>
} {
  const fieldsToAdd = new Map<CollectionConfig, OrderableFieldConfig[]>()
  const joinFieldPathsByCollection = new Map<string, Map<string, string>>()

  const addOrderableField = ({
    name,
    collection,
    joinOnFieldPath,
  }: {
    collection: CollectionConfig
    joinOnFieldPath?: string
    name: string
  }) => {
    const currentFields = fieldsToAdd.get(collection) || []
    const existingField = currentFields.find((field) => field.name === name)

    if (existingField) {
      if (joinOnFieldPath && !existingField.joinOnFieldPath) {
        existingField.joinOnFieldPath = joinOnFieldPath
      }
      return
    }

    fieldsToAdd.set(collection, [...currentFields, { name, joinOnFieldPath }])

    if (joinOnFieldPath) {
      const currentMap =
        joinFieldPathsByCollection.get(collection.slug) || new Map<string, string>()
      currentMap.set(name, joinOnFieldPath)
      joinFieldPathsByCollection.set(collection.slug, currentMap)
    }
  }

  config.collections.forEach((collection) => {
    if (collection.orderable) {
      addOrderableField({
        name: '_order',
        collection,
      })
      collection.defaultSort = collection.defaultSort ?? '_order'
    }

    traverseFields({
      callback: ({ field, parentRef, ref }) => {
        if (field.type === 'array' || field.type === 'blocks') {
          return false
        }

        if (field.type === 'group' || field.type === 'tab') {
          // @ts-expect-error ref is untyped
          const parentPrefix = parentRef?.prefix ? `${parentRef.prefix}_` : ''
          // @ts-expect-error ref is untyped
          ref.prefix = `${parentPrefix}${field.name}`
        }

        if (field.type === 'join' && field.orderable === true) {
          if (Array.isArray(field.collection)) {
            throw new APIError(
              'Orderable joins must target a single collection',
              httpStatus.BAD_REQUEST,
              {},
              true,
            )
          }

          const relationshipCollection = config.collections.find((c) => c.slug === field.collection)
          if (!relationshipCollection) {
            return false
          }

          // @ts-expect-error ref is untyped
          const prefix = parentRef?.prefix ? `${parentRef.prefix}_` : ''
          const joinOrderableFieldName = `_${field.collection}_${prefix}${field.name}_order`
          field.defaultSort = field.defaultSort ?? joinOrderableFieldName

          addOrderableField({
            name: joinOrderableFieldName,
            collection: relationshipCollection,
            joinOnFieldPath: field.on,
          })
        }
      },
      fields: collection.fields,
    })
  })

  return { fieldsToAdd, joinFieldPathsByCollection }
}
