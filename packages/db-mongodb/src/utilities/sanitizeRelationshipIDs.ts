import type { CollectionConfig, Field, SanitizedConfig, TraverseFieldsCallback } from 'payload'

import mongoose from 'mongoose'
import { APIError, traverseFields } from 'payload'
import { fieldAffectsData } from 'payload/shared'

type Args = {
  config: SanitizedConfig
  data: Record<string, unknown>
  fields: Field[]
}

interface RelationObject {
  relationTo: string
  value: number | string
}

function isValidRelationObject(value: unknown): value is RelationObject {
  return typeof value === 'object' && value !== null && 'relationTo' in value && 'value' in value
}

const convertValue = ({
  relatedCollection,
  value,
}: {
  relatedCollection: CollectionConfig
  value: number | string
}): mongoose.Types.ObjectId | number | string => {
  const customIDField = relatedCollection.fields.find(
    (field) => fieldAffectsData(field) && field.name === 'id',
  )

  if (!customIDField) {
    try {
      return new mongoose.Types.ObjectId(value)
    } catch (error) {
      throw new APIError(
        `Failed to create ObjectId from value: ${value}. Error: ${error.message}`,
        400,
      )
    }
  }

  return value
}

const sanitizeRelationship = ({ config, field, locale, ref, value }) => {
  let relatedCollection: CollectionConfig | undefined
  let result = value

  const hasManyRelations = typeof field.relationTo !== 'string'

  if (!hasManyRelations) {
    relatedCollection = config.collections?.find(({ slug }) => slug === field.relationTo)
  }

  if (Array.isArray(value)) {
    result = value.map((val) => {
      // Handle has many
      if (relatedCollection && val && (typeof val === 'string' || typeof val === 'number')) {
        return convertValue({
          relatedCollection,
          value: val,
        })
      }

      // Handle has many - polymorphic
      if (isValidRelationObject(val)) {
        const relatedCollectionForSingleValue = config.collections?.find(
          ({ slug }) => slug === val.relationTo,
        )

        if (relatedCollectionForSingleValue) {
          return {
            relationTo: val.relationTo,
            value: convertValue({
              relatedCollection: relatedCollectionForSingleValue,
              value: val.value,
            }),
          }
        }
      }

      return val
    })
  }

  // Handle has one - polymorphic
  if (isValidRelationObject(value)) {
    relatedCollection = config.collections?.find(({ slug }) => slug === value.relationTo)

    if (relatedCollection) {
      result = {
        relationTo: value.relationTo,
        value: convertValue({ relatedCollection, value: value.value }),
      }
    }
  }

  // Handle has one
  if (relatedCollection && value && (typeof value === 'string' || typeof value === 'number')) {
    result = convertValue({
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

export const sanitizeRelationshipIDs = ({
  config,
  data,
  fields,
}: Args): Record<string, unknown> => {
  const sanitize: TraverseFieldsCallback = ({ field, ref }) => {
    if (field.type === 'relationship' || field.type === 'upload') {
      // handle localized relationships
      if (config.localization && field.localized) {
        const locales = config.localization.locales
        const fieldRef = ref[field.name]
        for (const { code } of locales) {
          if (ref[field.name]?.[code]) {
            const value = ref[field.name][code]
            sanitizeRelationship({ config, field, locale: code, ref: fieldRef, value })
          }
        }
      } else {
        // handle non-localized relationships
        sanitizeRelationship({
          config,
          field,
          locale: undefined,
          ref,
          value: ref[field.name],
        })
      }
    }
  }

  traverseFields({ callback: sanitize, fields, ref: data })

  return data
}
