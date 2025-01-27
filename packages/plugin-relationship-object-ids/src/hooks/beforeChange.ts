import type { CollectionConfig, FieldHook, RelationshipField, UploadField } from 'payload/types'
import mongoose from 'mongoose'
import type { Config } from 'payload/config'
import { fieldAffectsData } from 'payload/dist/fields/config/types'

const convertValue = ({
  value,
  relatedCollection,
}: {
  value: string | number
  relatedCollection: CollectionConfig
}): mongoose.Types.ObjectId | string | number => {
  const customIDField = relatedCollection.fields.find(
    (field) => fieldAffectsData(field) && field.name === 'id',
  )

  if (!customIDField) return new mongoose.Types.ObjectId(value)

  return value
}

interface RelationObject {
  value: string | number
  relationTo: string
}

function isValidRelationObject(value: unknown): value is RelationObject {
  return typeof value === 'object' && value !== null && 'relationTo' in value && 'value' in value
}

export const getBeforeChangeHook =
  ({ config, field }: { config: Config; field: RelationshipField | UploadField }): FieldHook =>
  ({ value }) => {
    let relatedCollection: CollectionConfig | undefined

    const hasManyRelations = typeof field.relationTo !== 'string'

    if (!hasManyRelations) {
      relatedCollection = config.collections?.find(({ slug }) => slug === field.relationTo)
    }

    if (Array.isArray(value)) {
      return value.map((val) => {
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
        return {
          relationTo: value.relationTo,
          value: convertValue({ relatedCollection, value: value.value }),
        }
      }
    }

    // Handle has one
    if (relatedCollection && value && (typeof value === 'string' || typeof value === 'number')) {
      return convertValue({
        relatedCollection,
        value,
      })
    }

    return value
  }
