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
  versions?: boolean
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
  sort,
  sortAggregation,
  sortDirection,
}: {
  adapter: MongooseAdapter
  fields: FlattenedField[]
  path: string
  sort: Record<string, string>
  sortAggregation: PipelineStage[]
  sortDirection: SortDirection
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
      const relationshipPath = segments.slice(0, i + 1).join('.')
      const sortFieldPath = segments.slice(i + 1, segments.length).join('.')
      if (Array.isArray(field.relationTo)) {
        throw new APIError('Not supported')
      }

      const foreignCollection = getCollection({ adapter, collectionSlug: field.relationTo })

      if (
        !sortAggregation.some((each) => {
          return '$lookup' in each && each.$lookup.as === `__${path}`
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

        sort[`__${path}.${sortFieldPath}`] = sortDirection

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
      relationshipSort({
        adapter,
        fields,
        path: sortProperty,
        sort: acc,
        sortAggregation,
        sortDirection,
      })
    ) {
      return acc
    }

    const localizedProperty = getLocalizedSortProperty({
      config,
      fields,
      locale,
      parentIsLocalized,
      segments: sortProperty.split('.'),
    })
    acc[localizedProperty] = sortDirection

    return acc
  }, {})

  return sorting
}
