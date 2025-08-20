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
  sort?: Sort
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

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const field = currentFields.find((each) => each.name === segment)

    if (!field) {
      return false
    }

    if ('fields' in field) {
      currentFields = field.flattenedFields
      if (field.name === 'version' && versions && i === 0) {
        segments.shift()
        i--
      }
    } else if (
      (field.type === 'relationship' || field.type === 'upload') &&
      i !== segments.length - 1
    ) {
      const relationshipPath = segments.slice(0, i + 1).join('.')
      let sortFieldPath = segments.slice(i + 1, segments.length).join('.')
      if (sortFieldPath.endsWith('.id')) {
        sortFieldPath = sortFieldPath.split('.').slice(0, -1).join('.')
      }
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

      const as = `__${relationshipPath.replace(/\./g, '__')}`

      // If we have not already sorted on this relationship yet, we need to add a lookup stage
      if (!sortAggregation.some((each) => '$lookup' in each && each.$lookup.as === as)) {
        let localField = versions ? `version.${relationshipPath}` : relationshipPath

        if (adapter.usePipelineInSortLookup) {
          const flattenedField = `__${localField.replace(/\./g, '__')}_lookup`
          sortAggregation.push({
            $addFields: {
              [flattenedField]: `$${localField}`,
            },
          })
          localField = flattenedField
        }

        sortAggregation.push({
          $lookup: {
            as,
            foreignField: '_id',
            from: foreignCollection.Model.collection.name,
            localField,
            ...(!adapter.usePipelineInSortLookup && {
              pipeline: [
                {
                  $project: {
                    [sortFieldPath]: true,
                  },
                },
              ],
            }),
          },
        })

        if (adapter.usePipelineInSortLookup) {
          sortAggregation.push({
            $unset: localField,
          })
        }
      }

      if (!adapter.usePipelineInSortLookup) {
        const lookup = sortAggregation.find(
          (each) => '$lookup' in each && each.$lookup.as === as,
        ) as PipelineStage.Lookup
        const pipeline = lookup.$lookup.pipeline![0] as PipelineStage.Project
        pipeline.$project[sortFieldPath] = true
      }

      sort[`${as}.${sortFieldPath}`] = sortDirection
      return true
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

  // We use this flag to determine if the sort is unique or not to decide whether to add a fallback sort.
  const isUniqueSort = sort.some((item) => {
    const field = getFieldByPath({ fields, path: item })
    return field?.field?.unique
  })

  // In the case of Mongo, when sorting by a field that is not unique, the results are not guaranteed to be in the same order each time.
  // So we add a fallback sort to ensure that the results are always in the same order.
  let fallbackSort = '-id'

  if (timestamps) {
    fallbackSort = '-createdAt'
  }

  const includeFallbackSort =
    !adapter.disableFallbackSort &&
    !isUniqueSort &&
    !(sort.includes(fallbackSort) || sort.includes(fallbackSort.replace('-', '')))

  if (includeFallbackSort) {
    sort.push(fallbackSort)
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
