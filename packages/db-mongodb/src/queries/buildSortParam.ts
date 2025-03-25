import type { PipelineStage } from 'mongoose'

import {
  APIError,
  type FlattenedField,
  getFieldByPath,
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
  locale,
  path,
  sort,
  sortAggregation,
  sortDirection,
  versions,
}: {
  adapter: MongooseAdapter
  fields: FlattenedField[]
  locale?: string
  path: string
  sort: Record<string, string>
  sortAggregation: PipelineStage[]
  sortDirection: SortDirection
  versions?: boolean
}) => {
  let currentFields = fields
  const segments = path.split('.')
  if (segments.length < 2) {
    return false
  }

  for (const [i, segment] of segments.entries()) {
    if (versions && i === 0 && segment === 'version') {
      segments.shift()
      continue
    }

    const field = currentFields.find((each) => each.name === segment)

    if (!field) {
      return false
    }

    if ('fields' in field) {
      currentFields = field.flattenedFields
    } else if (
      (field.type === 'relationship' || field.type === 'upload') &&
      i !== segments.length - 1
    ) {
      const relationshipPath = segments.slice(0, i + 1).join('.')
      let sortFieldPath = segments.slice(i + 1, segments.length).join('.')
      if (Array.isArray(field.relationTo)) {
        throw new APIError('Not supported')
      }

      const foreignCollection = getCollection({ adapter, collectionSlug: field.relationTo })

      const foreignFieldPath = getFieldByPath({
        fields: foreignCollection.collectionConfig.flattenedFields,
        path: sortFieldPath,
      })

      if (!foreignFieldPath) {
        return false
      }

      if (foreignFieldPath.pathHasLocalized && locale) {
        sortFieldPath = foreignFieldPath.localizedPath.replace('<locale>', locale)
      }

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
  versions,
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
        locale,
        path: sortProperty,
        sort: acc,
        sortAggregation,
        sortDirection,
        versions,
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
