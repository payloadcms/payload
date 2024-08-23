import type { CollectionConfig, Field, SanitizedConfig } from 'payload'

import mongoose from 'mongoose'
import { traverseFields } from 'payload'
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

  if (!customIDField) return new mongoose.Types.ObjectId(value)

  return value
}

export const sanitizeRelationshipIDs = ({
  config,
  data,
  fields,
}: Args): Record<string, unknown> => {
  const sanitize = (field: Field, ref: unknown) => {
    if (field.type === 'relationship' || field.type === 'upload') {
      const value = ref[field.name]

      let relatedCollection: CollectionConfig | undefined

      const hasManyRelations = typeof field.relationTo !== 'string'

      if (!hasManyRelations) {
        relatedCollection = config.collections?.find(({ slug }) => slug === field.relationTo)
      }

      if (Array.isArray(value)) {
        ref[field.name] = value.map((val) => {
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
          ref[field.name] = {
            relationTo: value.relationTo,
            value: convertValue({ relatedCollection, value: value.value }),
          }
        }
      }

      // Handle has one
      if (relatedCollection && value && (typeof value === 'string' || typeof value === 'number')) {
        ref[field.name] = convertValue({
          relatedCollection,
          value,
        })
      }
    }
  }

  traverseFields(fields, sanitize, data, data)

  return data
}
