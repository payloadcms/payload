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
  previousField = '',
  sortAggregation,
}: {
  adapter: MongooseAdapter
  fields: FlattenedField[]
  locale?: string
  path: string
  previousField?: string
  sortAggregation: PipelineStage[]
  versions?: boolean
}): null | string => {
  let currentFields = fields
  const segments = path.split('.')
  if (segments.length < 2) {
    return null
  }

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const field = currentFields.find((each) => each.name === segment)

    if (!field) {
      return null
    }

    if ('fields' in field) {
      currentFields = field.flattenedFields
    } else if (
      (field.type === 'relationship' || field.type === 'upload') &&
      i !== segments.length - 1
    ) {
      const relationshipPath = segments.slice(0, i + 1).join('.')
      const nextPath = segments.slice(i + 1, segments.length)
      const relationshipFieldResult = getFieldByPath({ fields, path: relationshipPath })

      if (
        !relationshipFieldResult ||
        !('relationTo' in relationshipFieldResult.field) ||
        typeof relationshipFieldResult.field.relationTo !== 'string'
      ) {
        return null
      }

      const { collectionConfig, Model } = getCollection({
        adapter,
        collectionSlug: relationshipFieldResult.field.relationTo,
      })

      let localizedRelationshipPath: string = relationshipFieldResult.localizedPath

      if (locale && relationshipFieldResult.pathHasLocalized) {
        localizedRelationshipPath = relationshipFieldResult.localizedPath.replace(
          '<locale>',
          locale,
        )
      }

      if (nextPath.join('.') === 'id') {
        return `${previousField}${localizedRelationshipPath}`
      }

      const as = `__${previousField}${localizedRelationshipPath}`

      sortAggregation.push({
        $lookup: {
          as: `__${previousField}${localizedRelationshipPath}`,
          foreignField: '_id',
          from: Model.collection.name,
          localField: `${previousField}${localizedRelationshipPath}`,
        },
      })

      if (nextPath.length > 1) {
        const nextRes = relationshipSort({
          adapter,
          fields: collectionConfig.flattenedFields,
          locale,
          path: nextPath.join('.'),
          previousField: `${as}.`,
          sortAggregation,
        })

        if (nextRes) {
          return nextRes
        }

        return `${as}.${nextPath.join('.')}`
      }

      const nextField = getFieldByPath({
        fields: collectionConfig.flattenedFields,
        path: nextPath[0]!,
      })

      if (nextField && nextField.pathHasLocalized && locale) {
        return `${as}.${nextField.localizedPath.replace('<locale>', locale)}`
      }

      return `${as}.${nextPath[0]}`
    }
  }

  return null
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

    if (sortAggregation) {
      const sortRelProperty = relationshipSort({
        adapter,
        fields,
        locale,
        path: sortProperty,
        sortAggregation,
        versions,
      })

      if (sortRelProperty) {
        acc[sortRelProperty] = sortDirection
        return acc
      }
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
