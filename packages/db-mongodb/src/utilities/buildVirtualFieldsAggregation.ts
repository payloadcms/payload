import type { PipelineStage } from 'mongoose'

import { APIError, type FlattenedField, getFieldByPath } from 'payload'

import type { MongooseAdapter } from '../index.js'

import { getCollection } from './getEntity.js'

export const buildVirtualFieldsAggregation = ({
  adapter,
  fields,
  locale,
  prefix = '',
  result = [],
  rootFields = fields,
  versions,
}: {
  adapter: MongooseAdapter
  fields: FlattenedField[]
  locale?: string
  prefix?: string
  result?: PipelineStage[]
  rootFields?: FlattenedField[]
  versions?: boolean
}) => {
  for (const field of fields) {
    if (field.type === 'group' || field.type === 'tab') {
      buildVirtualFieldsAggregation({
        adapter,
        fields: field.flattenedFields,
        prefix: `${prefix}${field.name}.`,
        result,
        rootFields,
        versions,
      })
      continue
    }

    if ('virtual' in field && field.virtual && typeof field.virtual === 'object') {
      const relationshipPath = versions
        ? `version.${field.virtual.relationship}`
        : field.virtual.relationship
      const currentPath = `${prefix}${field.name}`
      const relationshipField = getFieldByPath({
        fields: rootFields,
        path: relationshipPath,
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
        const { collectionConfig, Model: RelationshipModel } = getCollection({
          adapter,
          collectionSlug: relationshipField.field.relationTo,
        })

        const foreignField = getFieldByPath({
          fields: collectionConfig.flattenedFields,
          path: field.virtual.path,
        })

        if (!foreignField) {
          throw new APIError('Foreign field was not found')
        }

        let foreignPath = field.virtual.path

        if (foreignField.pathHasLocalized && adapter.payload.config.localization) {
          foreignPath = foreignField.localizedPath.replace(
            '<locale>',
            locale || adapter.payload.config.localization.defaultLocale,
          )
        }

        result.push({
          $lookup: {
            as: currentPath,
            foreignField: '_id',
            from: RelationshipModel.collection.name,
            localField: relationshipPath,
            pipeline: [
              {
                $project: {
                  _id: 0,
                  [foreignPath]: 1,
                },
              },
            ],
          },
        })

        result.push({
          $addFields: {
            [currentPath]: {
              $first: `$${currentPath}.${foreignPath}`,
            },
          },
        })
      }
    }
  }

  return result
}
