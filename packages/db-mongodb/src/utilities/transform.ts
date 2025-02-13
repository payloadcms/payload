import type {
  CollectionConfig,
  DateField,
  Field,
  FlattenedBlock,
  FlattenedField,
  JoinField,
  RelationshipField,
  SanitizedConfig,
  TraverseFieldsCallback,
  UploadField,
} from 'payload'

import { Types } from 'mongoose'
import { flattenAllFields, traverseFields } from 'payload'
import { fieldAffectsData, fieldShouldBeLocalized } from 'payload/shared'

import type { MongooseAdapter } from '../index.js'

import { isObjectID } from './isObjectID.js'

interface RelationObject {
  relationTo: string
  value: number | string
}

function isValidRelationObject(value: unknown): value is RelationObject {
  return typeof value === 'object' && value !== null && 'relationTo' in value && 'value' in value
}

/**
 * Process relationship values for polymorphic and simple relationships
 * Used by both $push and $remove operations
 */
const processRelationshipValues = (
  items: unknown[],
  field: RelationshipField | UploadField,
  config: SanitizedConfig,
  operation: 'read' | 'write',
  validateRelationships: boolean,
  adapter: MongooseAdapter,
) => {
  return items.map((item) => {
    // Handle polymorphic relationships
    if (Array.isArray(field.relationTo) && isValidRelationObject(item)) {
      const relatedCollection = config.collections?.find(({ slug }) => slug === item.relationTo)
      if (relatedCollection) {
        return {
          relationTo: item.relationTo,
          value: convertRelationshipValue({
            adapter,
            operation,
            relatedCollection,
            validateRelationships,
            value: item.value,
          }),
        }
      }
      return item
    }

    // Handle simple relationships
    if (typeof field.relationTo === 'string') {
      const relatedCollection = config.collections?.find(({ slug }) => slug === field.relationTo)
      if (relatedCollection) {
        return convertRelationshipValue({
          adapter,
          operation,
          relatedCollection,
          validateRelationships,
          value: item,
        })
      }
    }

    return item
  })
}

const convertRelationshipValue = ({
  adapter,
  operation,
  relatedCollection,
  validateRelationships,
  value,
}: {
  adapter: MongooseAdapter
  operation: Args['operation']
  relatedCollection: CollectionConfig
  validateRelationships?: boolean
  value: unknown
}) => {
  const customIDField = relatedCollection.fields.find(
    (field) => fieldAffectsData(field) && field.name === 'id',
  )

  if (operation === 'read') {
    if (isObjectID(value)) {
      return value.toHexString()
    }

    if (
      customIDField?.type === 'number' &&
      typeof value === 'bigint' &&
      adapter.useBigIntForNumberIDs
    ) {
      return Number(value)
    }

    return value
  }

  if (customIDField) {
    return value
  }

  if (typeof value === 'string') {
    try {
      return new Types.ObjectId(value)
    } catch (e) {
      if (validateRelationships) {
        throw e
      }
      return value
    }
  }

  return value
}

const sanitizeRelationship = ({
  adapter,
  config,
  field,
  locale,
  operation,
  ref,
  validateRelationships,
  value,
}: {
  adapter: MongooseAdapter
  config: SanitizedConfig
  field: JoinField | RelationshipField | UploadField
  locale?: string
  operation: Args['operation']
  ref: Record<string, unknown>
  validateRelationships?: boolean
  value?: unknown
}) => {
  if (field.type === 'join') {
    if (
      operation === 'read' &&
      value &&
      typeof value === 'object' &&
      'docs' in value &&
      Array.isArray(value.docs)
    ) {
      for (let i = 0; i < value.docs.length; i++) {
        const item = value.docs[i]

        if (isObjectID(item)) {
          value.docs[i] = item.toHexString()
        } else if (Array.isArray(field.collection) && item) {
          // Fields here for polymorphic joins cannot be determinted, JSON.parse needed
          value.docs[i] = JSON.parse(JSON.stringify(value.docs[i]))
        }
      }
    }

    return value
  }
  let relatedCollection: CollectionConfig | undefined
  let result = value

  const hasManyRelations = typeof field.relationTo !== 'string'

  if (!hasManyRelations) {
    relatedCollection = config.collections?.find(({ slug }) => slug === field.relationTo)
  }

  if (Array.isArray(value)) {
    result = value.map((val) => {
      // Handle has many - polymorphic
      if (isValidRelationObject(val)) {
        const relatedCollectionForSingleValue = config.collections?.find(
          ({ slug }) => slug === val.relationTo,
        )

        if (relatedCollectionForSingleValue) {
          return {
            relationTo: val.relationTo,
            value: convertRelationshipValue({
              adapter,
              operation,
              relatedCollection: relatedCollectionForSingleValue,
              validateRelationships,
              value: val.value,
            }),
          }
        }
      }

      if (relatedCollection) {
        return convertRelationshipValue({
          adapter,
          operation,
          relatedCollection,
          validateRelationships,
          value: val,
        })
      }

      return val
    })
  }
  // Handle has one - polymorphic
  else if (isValidRelationObject(value)) {
    relatedCollection = config.collections?.find(({ slug }) => slug === value.relationTo)

    if (relatedCollection) {
      result = {
        relationTo: value.relationTo,
        value: convertRelationshipValue({
          adapter,
          operation,
          relatedCollection,
          validateRelationships,
          value: value.value,
        }),
      }
    }
  }
  // Handle has one
  else if (relatedCollection) {
    result = convertRelationshipValue({
      adapter,
      operation,
      relatedCollection,
      validateRelationships,
      value,
    })
  }

  if (locale) {
    ref[locale] = result
  } else {
    ref[field.name] = result
  }
}

const sanitizeDate = ({
  field,
  locale,
  ref,
  value,
}: {
  field: DateField
  locale?: string
  ref: Record<string, unknown>
  value: unknown
}) => {
  if (!value) {
    return
  }

  if (value instanceof Date) {
    value = value.toISOString()
  }

  if (locale) {
    ref[locale] = value
  } else {
    ref[field.name] = value
  }
}

type Args = {
  $addToSet?: Record<string, { $each: any[] } | any>
  $inc?: Record<string, number>
  $pull?: Record<string, { $in: any[] } | any>
  $push?: Record<string, { $each: any[] } | any>
  /** instance of the adapter */
  adapter: MongooseAdapter
  /** data to transform, can be an array of documents or a single document */
  data: Record<string, unknown> | Record<string, unknown>[]
  /** fields accossiated with the data */
  fields: Field[]
  /** slug of the global, pass only when the operation is `write` */
  globalSlug?: string
  /**
   * Type of the operation
   * read - sanitizes ObjectIDs, Date to strings.
   * write - sanitizes string relationships to ObjectIDs.
   */
  operation: 'read' | 'write'
  parentIsLocalized?: boolean
  /**
   * Throw errors on invalid relationships
   * @default true
   */
  validateRelationships?: boolean
}

const stripFields = ({
  config,
  data,
  fields,
  parentIsLocalized = false,
  reservedKeys = [],
}: {
  config: SanitizedConfig
  data: any
  fields: FlattenedField[]
  parentIsLocalized?: boolean
  reservedKeys?: string[]
}) => {
  for (const k in data) {
    if (!fields.some((field) => field.name === k) && !reservedKeys.includes(k)) {
      delete data[k]
    }
  }

  for (const field of fields) {
    reservedKeys = []
    const fieldData = data[field.name]
    if (!fieldData || typeof fieldData !== 'object') {
      continue
    }

    const shouldLocalizeField = fieldShouldBeLocalized({ field, parentIsLocalized })

    if (field.type === 'blocks') {
      reservedKeys.push('blockType')
    }

    if ('flattenedFields' in field || 'blocks' in field) {
      if (shouldLocalizeField && config.localization) {
        for (const localeKey in fieldData) {
          if (!config.localization.localeCodes.some((code) => code === localeKey)) {
            delete fieldData[localeKey]
            continue
          }

          const localeData = fieldData[localeKey]

          if (!localeData || typeof localeData !== 'object') {
            continue
          }

          if (field.type === 'array' || field.type === 'blocks') {
            if (!Array.isArray(localeData)) {
              continue
            }

            let hasNull = false
            for (let i = 0; i < localeData.length; i++) {
              const data = localeData[i]
              let fields: FlattenedField[] | null = null

              if (field.type === 'array') {
                fields = field.flattenedFields
              } else {
                let maybeBlock: FlattenedBlock | undefined = undefined

                if (field.blockReferences) {
                  const maybeBlockReference = field.blockReferences.find((each) => {
                    const slug = typeof each === 'string' ? each : each.slug
                    return slug === data.blockType
                  })

                  if (maybeBlockReference) {
                    if (typeof maybeBlockReference === 'object') {
                      maybeBlock = maybeBlockReference
                    } else {
                      maybeBlock = config.blocks?.find((each) => each.slug === maybeBlockReference)
                    }
                  }
                }

                if (!maybeBlock) {
                  maybeBlock = field.blocks.find((each) => each.slug === data.blockType)
                }

                if (maybeBlock) {
                  fields = maybeBlock.flattenedFields
                } else {
                  localeData[i] = null
                  hasNull = true
                }
              }

              if (!fields) {
                continue
              }

              stripFields({
                config,
                data,
                fields,
                parentIsLocalized: parentIsLocalized || field.localized,
                reservedKeys,
              })
            }

            if (hasNull) {
              fieldData[localeKey] = localeData.filter(Boolean)
            }

            continue
          } else {
            stripFields({
              config,
              data: localeData,
              fields: field.flattenedFields,
              parentIsLocalized: parentIsLocalized || field.localized,
              reservedKeys,
            })
          }
        }
        continue
      }

      if (field.type === 'array' || field.type === 'blocks') {
        if (!Array.isArray(fieldData)) {
          continue
        }

        let hasNull = false

        for (let i = 0; i < fieldData.length; i++) {
          const data = fieldData[i]
          let fields: FlattenedField[] | null = null

          if (field.type === 'array') {
            fields = field.flattenedFields
          } else {
            let maybeBlock: FlattenedBlock | undefined = undefined

            if (field.blockReferences) {
              const maybeBlockReference = field.blockReferences.find((each) => {
                const slug = typeof each === 'string' ? each : each.slug
                return slug === data.blockType
              })

              if (maybeBlockReference) {
                if (typeof maybeBlockReference === 'object') {
                  maybeBlock = maybeBlockReference
                } else {
                  maybeBlock = config.blocks?.find((each) => each.slug === maybeBlockReference)
                }
              }
            }

            if (!maybeBlock) {
              maybeBlock = field.blocks.find((each) => each.slug === data.blockType)
            }

            if (maybeBlock) {
              fields = maybeBlock.flattenedFields
            } else {
              fieldData[i] = null
              hasNull = true
            }
          }

          if (!fields) {
            continue
          }

          stripFields({
            config,
            data,
            fields,
            parentIsLocalized: parentIsLocalized || field.localized,
            reservedKeys,
          })
        }

        if (hasNull) {
          data[field.name] = fieldData.filter(Boolean)
        }

        continue
      } else {
        stripFields({
          config,
          data: fieldData,
          fields: field.flattenedFields,
          parentIsLocalized: parentIsLocalized || field.localized,
          reservedKeys,
        })
      }
    }
  }
}

/**
 * A function that transforms Payload <-> MongoDB data.
 * @internal - this function may be removed or receive breaking changes in minor releases.
 */
export const transform = ({
  $addToSet,
  $inc,
  $pull,
  $push,
  adapter,
  data,
  fields,
  globalSlug,
  operation,
  parentIsLocalized = false,
  validateRelationships = true,
}: Args) => {
  if (!data) {
    return null
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      transform({
        $addToSet,
        $inc,
        $pull,
        $push,
        adapter,
        data: item,
        fields,
        globalSlug,
        operation,
        validateRelationships,
      })
    }
    return
  }

  const {
    payload: { config },
  } = adapter

  if (operation === 'read') {
    delete data['__v']
    data.id = data._id || data.id
    delete data['_id']

    if (isObjectID(data.id)) {
      data.id = data.id.toHexString()
    }

    // Handle BigInt conversion for custom ID fields of type 'number'
    if (adapter.useBigIntForNumberIDs && typeof data.id === 'bigint') {
      data.id = Number(data.id)
    }

    if (!adapter.allowAdditionalKeys) {
      stripFields({
        config,
        data,
        fields: flattenAllFields({ cache: true, fields }),
        parentIsLocalized: false,
        reservedKeys: ['id', 'globalType'],
      })
    }
  }

  if (operation === 'write' && globalSlug) {
    data.globalType = globalSlug
  }

  const sanitize: TraverseFieldsCallback = ({
    field,
    parentIsLocalized,
    parentPath,
    parentRef: incomingParentRef,
    ref: incomingRef,
  }) => {
    if (!incomingRef || typeof incomingRef !== 'object') {
      return
    }

    const ref = incomingRef as Record<string, unknown>
    const parentRef = (incomingParentRef || {}) as Record<string, unknown>

    // Clear empty parent containers by setting them to undefined.
    const clearEmptyContainer = () => {
      if (!parentRef || typeof parentRef !== 'object') {
        return
      }
      if (!ref || typeof ref !== 'object') {
        return
      }
      if (Object.keys(ref).length > 0) {
        return
      }
      const containerKey = Object.keys(parentRef).find((k) => parentRef[k] === ref)
      if (containerKey) {
        parentRef[containerKey] = undefined
      }
    }

    if (
      $inc &&
      field.type === 'number' &&
      operation === 'write' &&
      field.name in ref &&
      ref[field.name]
    ) {
      const value = ref[field.name]
      if (value && typeof value === 'object' && '$inc' in value && typeof value.$inc === 'number') {
        $inc[`${parentPath}${field.name}`] = value.$inc
        delete ref[field.name]
        clearEmptyContainer()
      }
    }

    if (
      $push &&
      field.type === 'array' &&
      operation === 'write' &&
      field.name in ref &&
      ref[field.name]
    ) {
      const value = ref[field.name]

      if (
        value &&
        typeof value === 'object' &&
        ('$push' in value ||
          (config.localization &&
            fieldShouldBeLocalized({ field, parentIsLocalized }) &&
            Object.values(value).some(
              (localeValue) =>
                localeValue && typeof localeValue === 'object' && '$push' in localeValue,
            )))
      ) {
        if (config.localization && fieldShouldBeLocalized({ field, parentIsLocalized })) {
          // Handle localized fields: { field: { locale: { $push: data } } }
          let hasLocaleOperations = false
          Object.entries(value).forEach(([localeKey, localeValue]) => {
            if (localeValue && typeof localeValue === 'object' && '$push' in localeValue) {
              hasLocaleOperations = true
              const push = localeValue.$push
              if (Array.isArray(push)) {
                $push[`${parentPath}${field.name}.${localeKey}`] = { $each: push }
              } else if (typeof push === 'object') {
                $push[`${parentPath}${field.name}.${localeKey}`] = push
              }
            }
          })

          if (hasLocaleOperations) {
            delete ref[field.name]
            clearEmptyContainer()
          }
        } else if (value && typeof value === 'object' && '$push' in value) {
          // Handle non-localized fields: { field: { $push: data } }
          const push = value.$push
          if (Array.isArray(push)) {
            $push[`${parentPath}${field.name}`] = { $each: push }
          } else if (typeof push === 'object') {
            $push[`${parentPath}${field.name}`] = push
          }
          delete ref[field.name]
          clearEmptyContainer()
        }
      }
    }

    // Handle $push operation for relationship fields (converts to $addToSet)

    // Handle $push operation for relationship fields (converts to $addToSet) - unified approach
    if (
      $addToSet &&
      (field.type === 'relationship' || field.type === 'upload') &&
      'hasMany' in field &&
      field.hasMany &&
      operation === 'write' &&
      field.name in ref &&
      ref[field.name]
    ) {
      const value = ref[field.name]

      if (
        value &&
        typeof value === 'object' &&
        ('$push' in value ||
          (config.localization &&
            fieldShouldBeLocalized({ field, parentIsLocalized }) &&
            Object.values(value).some(
              (localeValue) =>
                localeValue &&
                typeof localeValue === 'object' &&
                '$push' in (localeValue as Record<string, unknown>),
            )))
      ) {
        if (config.localization && fieldShouldBeLocalized({ field, parentIsLocalized })) {
          // Handle localized fields: { field: { locale: { $push: data } } }
          let hasLocaleOperations = false
          Object.entries(value).forEach(([localeKey, localeValue]) => {
            if (localeValue && typeof localeValue === 'object' && '$push' in localeValue) {
              hasLocaleOperations = true
              const push = localeValue.$push
              const localeItems = Array.isArray(push) ? push : [push]
              const processedLocaleItems = processRelationshipValues(
                localeItems,
                field,
                config,
                operation,
                validateRelationships,
                adapter,
              )
              $addToSet[`${parentPath}${field.name}.${localeKey}`] = { $each: processedLocaleItems }
            }
          })

          if (hasLocaleOperations) {
            delete ref[field.name]
            clearEmptyContainer()
          }
        } else if (value && typeof value === 'object' && '$push' in value) {
          // Handle non-localized fields: { field: { $push: data } }
          const itemsToAppend = Array.isArray(value.$push) ? value.$push : [value.$push]
          const processedItems = processRelationshipValues(
            itemsToAppend,
            field,
            config,
            operation,
            validateRelationships,
            adapter,
          )
          $addToSet[`${parentPath}${field.name}`] = { $each: processedItems }
          delete ref[field.name]
          clearEmptyContainer()
        }
      }
    }

    // Handle $remove operation for relationship fields (converts to $pull)
    if (
      $pull &&
      (field.type === 'relationship' || field.type === 'upload') &&
      'hasMany' in field &&
      field.hasMany &&
      operation === 'write' &&
      field.name in ref &&
      ref[field.name]
    ) {
      const value = ref[field.name]
      if (
        value &&
        typeof value === 'object' &&
        ('$remove' in value ||
          (config.localization &&
            fieldShouldBeLocalized({ field, parentIsLocalized }) &&
            Object.values(value).some(
              (localeValue) =>
                localeValue &&
                typeof localeValue === 'object' &&
                '$remove' in (localeValue as Record<string, unknown>),
            )))
      ) {
        if (config.localization && fieldShouldBeLocalized({ field, parentIsLocalized })) {
          // Handle localized fields: { field: { locale: { $remove: data } } }
          let hasLocaleOperations = false
          Object.entries(value).forEach(([localeKey, localeValue]) => {
            if (localeValue && typeof localeValue === 'object' && '$remove' in localeValue) {
              hasLocaleOperations = true
              const remove = localeValue.$remove
              const localeItems = Array.isArray(remove) ? remove : [remove]
              const processedLocaleItems = processRelationshipValues(
                localeItems,
                field,
                config,
                operation,
                validateRelationships,
                adapter,
              )
              $pull[`${parentPath}${field.name}.${localeKey}`] = { $in: processedLocaleItems }
            }
          })

          if (hasLocaleOperations) {
            delete ref[field.name]
            clearEmptyContainer()
          }
        } else if (value && typeof value === 'object' && '$remove' in value) {
          // Handle non-localized fields: { field: { $remove: data } }
          const itemsToRemove = Array.isArray(value.$remove) ? value.$remove : [value.$remove]
          const processedItems = processRelationshipValues(
            itemsToRemove,
            field,
            config,
            operation,
            validateRelationships,
            adapter,
          )
          $pull[`${parentPath}${field.name}`] = { $in: processedItems }
          delete ref[field.name]
          clearEmptyContainer()
        }
      }
    }

    if (field.type === 'date' && operation === 'read' && field.name in ref && ref[field.name]) {
      if (config.localization && fieldShouldBeLocalized({ field, parentIsLocalized })) {
        const fieldRef = ref[field.name] as Record<string, unknown>
        if (!fieldRef || typeof fieldRef !== 'object') {
          return
        }

        for (const locale of config.localization.localeCodes) {
          sanitizeDate({
            field,
            locale,
            ref: fieldRef,
            value: fieldRef[locale],
          })
        }
      } else {
        sanitizeDate({
          field,
          ref,
          value: ref[field.name],
        })
      }
    }

    if (
      field.type === 'relationship' ||
      field.type === 'upload' ||
      (operation === 'read' && field.type === 'join')
    ) {
      if (!ref[field.name]) {
        return
      }

      // handle localized relationships
      if (config.localization && fieldShouldBeLocalized({ field, parentIsLocalized })) {
        const locales = config.localization.locales
        const fieldRef = ref[field.name] as Record<string, unknown>
        if (typeof fieldRef !== 'object') {
          return
        }

        for (const { code } of locales) {
          const value = fieldRef[code]
          if (value) {
            sanitizeRelationship({
              adapter,
              config,
              field,
              locale: code,
              operation,
              ref: fieldRef,
              validateRelationships,
              value,
            })
          }
        }
      } else {
        // handle non-localized relationships
        sanitizeRelationship({
          adapter,
          config,
          field,
          locale: undefined,
          operation,
          ref,
          validateRelationships,
          value: ref[field.name],
        })
      }
    }
  }

  traverseFields({
    callback: sanitize,
    config,
    fields,
    fillEmpty: false,
    parentIsLocalized,
    ref: data,
  })

  if (operation === 'write') {
    if (typeof data.updatedAt === 'undefined') {
      // If data.updatedAt is explicitly set to `null` we should not set it - this means we don't want to change the value of updatedAt.
      data.updatedAt = new Date().toISOString()
    } else if (data.updatedAt === null) {
      // `updatedAt` may be explicitly set to null to disable updating it - if that is the case, we need to delete the property. Keeping it as null will
      // cause the database to think we want to set it to null, which we don't.
      delete data.updatedAt
    }
  }
}
