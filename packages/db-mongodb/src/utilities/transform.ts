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

interface RelationObject {
  relationTo: string
  value: number | string
}

function isValidRelationObject(value: unknown): value is RelationObject {
  return typeof value === 'object' && value !== null && 'relationTo' in value && 'value' in value
}

const convertRelationshipValue = ({
  operation,
  relatedCollection,
  validateRelationships,
  value,
}: {
  operation: Args['operation']
  relatedCollection: CollectionConfig
  validateRelationships?: boolean
  value: unknown
}) => {
  const customIDField = relatedCollection.fields.find(
    (field) => fieldAffectsData(field) && field.name === 'id',
  )

  if (operation === 'read') {
    if (value instanceof Types.ObjectId) {
      return value.toHexString()
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
  config,
  field,
  locale,
  operation,
  ref,
  validateRelationships,
  value,
}: {
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

        if (item instanceof Types.ObjectId) {
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
  reservedKeys = [],
}: {
  config: SanitizedConfig
  data: any
  fields: FlattenedField[]
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

    if (field.type === 'blocks') {
      reservedKeys.push('blockType')
    }

    if ('flattenedFields' in field || 'blocks' in field) {
      if (field.localized && config.localization) {
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

            for (const data of localeData) {
              let fields: FlattenedField[] | null = null

              if (field.type === 'array') {
                fields = field.flattenedFields
              } else {
                let maybeBlock: FlattenedBlock | undefined = undefined

                if (field.blockReferences) {
                  const maybeBlockReference = field.blockReferences.find(
                    (each) => typeof each === 'object' && each.slug === data.blockType,
                  )
                  if (maybeBlockReference && typeof maybeBlockReference === 'object') {
                    maybeBlock = maybeBlockReference
                  }
                }

                if (!maybeBlock) {
                  maybeBlock = field.blocks.find((each) => each.slug === data.blockType)
                }

                if (maybeBlock) {
                  fields = maybeBlock.flattenedFields
                }
              }

              if (!fields) {
                continue
              }

              stripFields({ config, data, fields, reservedKeys })
            }

            continue
          } else {
            stripFields({ config, data: localeData, fields: field.flattenedFields, reservedKeys })
          }
        }
        continue
      }

      if (field.type === 'array' || field.type === 'blocks') {
        if (!Array.isArray(fieldData)) {
          continue
        }

        for (const data of fieldData) {
          let fields: FlattenedField[] | null = null

          if (field.type === 'array') {
            fields = field.flattenedFields
          } else {
            let maybeBlock: FlattenedBlock | undefined = undefined

            if (field.blockReferences) {
              const maybeBlockReference = field.blockReferences.find(
                (each) => typeof each === 'object' && each.slug === data.blockType,
              )

              if (maybeBlockReference && typeof maybeBlockReference === 'object') {
                maybeBlock = maybeBlockReference
              }
            }

            if (!maybeBlock) {
              maybeBlock = field.blocks.find((each) => each.slug === data.blockType)
            }

            if (maybeBlock) {
              fields = maybeBlock.flattenedFields
            }
          }

          if (!fields) {
            continue
          }

          stripFields({ config, data, fields, reservedKeys })
        }

        continue
      } else {
        stripFields({ config, data: fieldData, fields: field.flattenedFields, reservedKeys })
      }
    }
  }
}

export const transform = ({
  adapter,
  data,
  fields,
  globalSlug,
  operation,
  parentIsLocalized = false,
  validateRelationships = true,
}: Args) => {
  if (Array.isArray(data)) {
    for (const item of data) {
      transform({ adapter, data: item, fields, globalSlug, operation, validateRelationships })
    }
    return
  }

  const {
    payload: { config },
  } = adapter

  if (operation === 'read') {
    delete data['__v']
    data.id = data._id
    delete data['_id']

    if (data.id instanceof Types.ObjectId) {
      data.id = data.id.toHexString()
    }

    if (!adapter.allowAdditionalKeys) {
      stripFields({
        config,
        data,
        fields: flattenAllFields({ cache: true, fields }),
        reservedKeys: ['id', 'globalType'],
      })
    }
  }

  if (operation === 'write' && globalSlug) {
    data.globalType = globalSlug
  }

  const sanitize: TraverseFieldsCallback = ({ field, ref: incomingRef }) => {
    if (!incomingRef || typeof incomingRef !== 'object') {
      return
    }

    const ref = incomingRef as Record<string, unknown>

    if (field.type === 'date' && operation === 'read' && field.name in ref && ref[field.name]) {
      if (config.localization && fieldShouldBeLocalized({ field, parentIsLocalized })) {
        const fieldRef = ref[field.name] as Record<string, unknown>
        if (!fieldRef || typeof fieldRef !== 'object') {
          return
        }

        for (const locale of config.localization.localeCodes) {
          sanitizeDate({
            field,
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
}
