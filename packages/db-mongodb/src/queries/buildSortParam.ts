import type { PipelineStage } from 'mongoose'

import {
  APIError,
  type FlattenedField,
  getLocalizedPaths,
  type SanitizedConfig,
  type Sort,
} from 'payload'

import type { MongooseAdapter } from '../index.js'

import { getCollection } from '../utilities/getEntity.js'
import { getLocalizedSortProperty } from './getLocalizedSortProperty.js'

type Args = {
  adapter: MongooseAdapter
  config: SanitizedConfig
  fields: FlattenedField[]
  locale?: string
  parentIsLocalized?: boolean
  sort: Sort
  sortAggregation?: PipelineStage[]
  timestamps: boolean
}

export type SortArgs = {
  direction: SortDirection
  property: string
}[]

export type SortDirection = 'asc' | 'desc'

const relationshipSort = ({
  adapter,
  fields,
  path,
  sortAggregation,
}: {
  adapter: MongooseAdapter
  fields: FlattenedField[]
  path: string
  sortAggregation: PipelineStage[]
}) => {
  let currentFields = fields
  const segments = path.split('.')
  if (segments.length < 2) {
    return false
  }

  for (const [i, segment] of segments.entries()) {
    const field = currentFields.find((each) => each.name === segment)

    if (!field) {
      return false
    }

    if ('fields' in field) {
      currentFields = field.flattenedFields
    } else if (field.type === 'relationship' && i !== segments.length - 1) {
      const relationshipPath = segments.splice(0, i).join('.')
      const sortFieldPath = segments.splice(i + 1, segments.length).join('.')
      if (Array.isArray(field.relationTo)) {
        throw new APIError('Not supported')
      }

      const foreignCollection = getCollection({ adapter, collectionSlug: field.relationTo })

      if (
        sortAggregation.some((each) => {
          if ('$lookup' in each && each.$lookup.as === `__${path}`) {
            return false
          }
          return true
        })
      ) {
        sortAggregation.push({
          $lookup: {
            as: `__${path}`,
            foreignField: '_id',
            from: foreignCollection.Model.collection.name,
            localField: relationshipPath,
            pipeline: [
              {
                $project: {
                  [sortFieldPath]: true,
                },
              },
            ],
          },
        })
        return true
      }
    }
  }

  return false
}

export const buildSortParam = ({
  adapter,
  config,
  fields,
  locale,
  parentIsLocalized = false,
  sort,
  sortAggregation,
  timestamps,
}: Args): Record<string, string> => {
  if (!sort) {
    if (timestamps) {
      sort = '-createdAt'
    } else {
      sort = '-id'
    }
  }

  if (typeof sort === 'string') {
    sort = [sort]
  }

  const sorting = sort.reduce<Record<string, string>>((acc, item) => {
    let sortProperty: string
    let sortDirection: SortDirection
    if (item.indexOf('-') === 0) {
      sortProperty = item.substring(1)
      sortDirection = 'desc'
    } else {
      sortProperty = item
      sortDirection = 'asc'
    }
    if (sortProperty === 'id') {
      acc['_id'] = sortDirection
      return acc
    }

    if (
      sortAggregation &&
      relationshipSort({ adapter, fields, path: sortProperty, sortAggregation })
    ) {
      sortProperty = `__${sortProperty}`
      acc[sortProperty] = sortDirection
    } else {
      const localizedProperty = getLocalizedSortProperty({
        config,
        fields,
        locale,
        parentIsLocalized,
        segments: sortProperty.split('.'),
      })
      acc[localizedProperty] = sortDirection
    }
    return acc
  }, {})

  return sorting
}
