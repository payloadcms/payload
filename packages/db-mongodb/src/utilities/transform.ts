import type {
  CollectionConfig,
  DateField,
  FlattenedField,
  JoinField,
  RelationshipField,
  SanitizedConfig,
  TraverseFlattenedFieldsCallback,
  UploadField,
} from 'payload'

import { Types } from 'mongoose'
import { traverseFields } from 'payload'
import { fieldAffectsData, fieldIsVirtual } from 'payload/shared'

import type { MongooseAdapter } from '../index.js'

type Args = {
  adapter: MongooseAdapter
  data: Record<string, unknown> | Record<string, unknown>[]
  fields: FlattenedField[]
  globalSlug?: string
  operation: 'create' | 'read' | 'update'
  /**
   * Throw errors on invalid relationships
   * @default true
   */
  validateRelationships?: boolean
}

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

/**
 * When sending data to Payload - convert Date to string.
 * Vice versa when sending data to MongoDB so dates are stored properly.
 */
const sanitizeDate = ({
  field,
  locale,
  operation,
  ref,
  value,
}: {
  field: DateField
  locale?: string
  operation: Args['operation']
  ref: Record<string, unknown>
  value: unknown
}) => {
  if (!value) {
    return
  }

  if (operation === 'read') {
    if (value instanceof Date) {
      value = value.toISOString()
    }
  } else {
    if (typeof value === 'string') {
      value = new Date(value)
    }
  }

  if (locale) {
    ref[locale] = value
  } else {
    ref[field.name] = value
  }
}

export const transform = ({
  adapter,
  data,
  fields,
  globalSlug,
  operation,
  validateRelationships = true,
}: Args) => {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      transform({ adapter, data: data[i], fields, globalSlug, operation, validateRelationships })
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
  }

  if (operation !== 'read') {
    if (operation === 'create' && !data.createdAt) {
      data.createdAt = new Date()
    }

    data.updatedAt = new Date()

    if (globalSlug) {
      data.globalType = globalSlug
    }
  }

  const sanitize: TraverseFlattenedFieldsCallback = ({ field, ref }) => {
    if (!ref || typeof ref !== 'object') {
      return
    }

    if (operation !== 'read') {
      if (
        typeof ref[field.name] === 'undefined' &&
        typeof field.defaultValue !== 'undefined' &&
        typeof field.defaultValue !== 'function'
      ) {
        if (field.type === 'point') {
          ref[field.name] = {
            type: 'Point',
            coordinates: field.defaultValue,
          }
        } else {
          ref[field.name] = field.defaultValue
        }
      }

      if (fieldIsVirtual(field)) {
        delete ref[field.name]
        return
      }
    }

    if (field.type === 'date') {
      if (config.localization && field.localized) {
        const fieldRef = ref[field.name]
        if (!fieldRef || typeof fieldRef !== 'object') {
          return
        }

        for (const locale of config.localization.localeCodes) {
          sanitizeDate({
            field,
            operation,
            ref: fieldRef,
            value: fieldRef[locale],
          })
        }
      } else {
        sanitizeDate({
          field,
          operation,
          ref: ref as Record<string, unknown>,
          value: ref[field.name],
        })
      }
    }

    if (
      field.type === 'relationship' ||
      field.type === 'upload' ||
      (operation === 'read' && field.type === 'join')
    ) {
      // sanitize passed undefined in objects to null
      if (operation !== 'read' && field.name in ref && ref[field.name] === undefined) {
        ref[field.name] = null
      }

      if (!ref[field.name]) {
        return
      }

      // handle localized relationships
      if (config.localization && field.localized) {
        const locales = config.localization.locales
        const fieldRef = ref[field.name]
        if (typeof fieldRef !== 'object') {
          return
        }

        for (const { code } of locales) {
          const value = ref[field.name][code]
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
          ref: ref as Record<string, unknown>,
          validateRelationships,
          value: ref[field.name],
        })
      }
    }
  }

  traverseFields({ callback: sanitize, fillEmpty: false, flattenedFields: fields, ref: data })
}
