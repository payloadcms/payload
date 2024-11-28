import type {
  CollectionConfig,
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
  insert?: boolean
  type: 'read' | 'write'
}

interface RelationObject {
  relationTo: string
  value: number | string
}

function isValidRelationObject(value: unknown): value is RelationObject {
  return typeof value === 'object' && value !== null && 'relationTo' in value && 'value' in value
}

const convertValue = ({
  type,
  relatedCollection,
  value,
}: {
  relatedCollection: CollectionConfig
  type: 'read' | 'write'
  value: unknown
}) => {
  const customIDField = relatedCollection.fields.find(
    (field) => fieldAffectsData(field) && field.name === 'id',
  )

  if (type === 'read') {
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
    } catch {
      return value
    }
  }

  return value
}

const sanitizeRelationship = ({
  type,
  config,
  field,
  locale,
  ref,
  value,
}: {
  config: SanitizedConfig
  field: JoinField | RelationshipField | UploadField
  locale?: string
  ref: Record<string, unknown>
  type: 'read' | 'write'
  value?: unknown
}) => {
  if (field.type === 'join') {
    if (value && typeof value === 'object' && 'docs' in value && Array.isArray(value.docs)) {
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
            value: convertValue({
              type,
              relatedCollection: relatedCollectionForSingleValue,
              value: val.value,
            }),
          }
        }
      }

      if (relatedCollection) {
        return convertValue({
          type,
          relatedCollection,
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
        value: convertValue({ type, relatedCollection, value: value.value }),
      }
    }
  }
  // Handle has one
  else if (relatedCollection) {
    result = convertValue({
      type,
      relatedCollection,
      value,
    })
  }

  if (locale) {
    ref[locale] = result
  } else {
    ref[field.name] = result
  }
}

export const transform = ({ type, adapter, data, fields, globalSlug, insert }: Args) => {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      transform({ type, adapter, data: data[i], fields })
    }
    return
  }

  const {
    payload: { config },
  } = adapter

  if (type === 'read') {
    delete data['__v']
    data.id = data._id
    delete data['_id']

    if (data.id instanceof Types.ObjectId) {
      data.id = data.id.toHexString()
    }
  }

  if (type === 'write') {
    if (insert && !data.createdAt) {
      data.createdAt = new Date()
    }

    if (!data.updatedAt || insert) {
      data.updatedAt = new Date()
    }

    if (globalSlug) {
      data.globalType = globalSlug
    }
  }

  const sanitize: TraverseFlattenedFieldsCallback = ({ field, ref }) => {
    if (!ref || typeof ref !== 'object') {
      return
    }

    if (type === 'write') {
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
      if (type === 'read') {
        const value = ref[field.name]
        if (value && value instanceof Date) {
          ref[field.name] = value.toISOString()
        }
      }
    }

    if (
      field.type === 'relationship' ||
      field.type === 'upload' ||
      (type === 'read' && field.type === 'join')
    ) {
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
              type,
              config,
              field,
              locale: code,
              ref: fieldRef,
              value,
            })
          }
        }
      } else {
        // handle non-localized relationships
        sanitizeRelationship({
          type,
          config,
          field,
          locale: undefined,
          ref: ref as Record<string, unknown>,
          value: ref[field.name],
        })
      }
    }
  }

  traverseFields({ callback: sanitize, fillEmpty: false, flattenedFields: fields, ref: data })
}
