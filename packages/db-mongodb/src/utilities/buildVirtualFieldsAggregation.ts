import type { PipelineStage } from 'mongoose'

import { APIError, type FlattenedField, getFieldByPath } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { getCollection } from './getEntity.js'

export const buildVirtualFieldsAggregation = ({
  adapter,
  fields,
  prefix = '',
  result = [],
  rootFields = fields,
}: {
  adapter: MongooseAdapter
  fields: FlattenedField[]
  prefix?: string
  result?: PipelineStage[]
  rootFields?: FlattenedField[]
}) => {
  for (const field of fields) {
    if (field.type === 'group' || field.type === 'tab') {
      buildVirtualFieldsAggregation({
        adapter,
        fields: field.flattenedFields,
        prefix: `${prefix}${field.name}.`,
        result,
        rootFields,
      })
      continue
    }

    if ('virtual' in field && field.virtual && typeof field.virtual === 'object') {
      const currentPath = `${prefix}${field.name}`
      const relationshipField = getFieldByPath({
        fields: rootFields,
        path: field.virtual.relationship,
      })

      if (!relationshipField) {
        throw new APIError('Relationship was not found')
      }

      if (
        (relationshipField.field.type === 'relationship' ||
          relationshipField.field.type === 'upload') &&
        !relationshipField.field.hasMany &&
        typeof relationshipField.field.relationTo === 'string'
      ) {
        const { Model: RelationshipModel } = getCollection({
          adapter,
          collectionSlug: relationshipField.field.relationTo,
        })

        result.push({
          $lookup: {
            as: currentPath,
            foreignField: '_id',
            from: RelationshipModel.collection.name,
            localField: field.virtual.relationship,
            pipeline: [
              {
                $project: {
                  _id: 0,
                  [field.virtual.path]: 1,
                },
              },
            ],
          },
        })

        result.push({
          $addFields: {
            [currentPath]: {
              $first: `$${currentPath}.${field.virtual.path}`,
            },
          },
        })
      }
    }
  }

  return result
}
