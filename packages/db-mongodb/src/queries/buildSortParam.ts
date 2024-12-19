import type { PaginateOptions } from 'mongoose'
import type { FlattenedField, SanitizedConfig, Sort } from 'payload'

import { getLocalizedSortProperty } from './getLocalizedSortProperty.js'

type Args = {
  config: SanitizedConfig
  fields: FlattenedField[]
  locale: string
  sort: Sort
  timestamps: boolean
}

export const buildSortParam = ({
  config,
  fields,
  locale,
  sort,
  timestamps,
}: Args): Record<string, -1 | 1> => {
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

  const sorting = sort.reduce<Record<string, -1 | 1>>((acc, item) => {
    let sortProperty: string
    let sortDirection: -1 | 1
    if (item.indexOf('-') === 0) {
      sortProperty = item.substring(1)
      sortDirection = -1
    } else {
      sortProperty = item
      sortDirection = 1
    }
    if (sortProperty === 'id') {
      acc['_id'] = sortDirection
      return acc
    }
    const localizedProperty = getLocalizedSortProperty({
      config,
      fields,
      locale,
      segments: sortProperty.split('.'),
    })
    acc[localizedProperty] = sortDirection
    return acc
  }, {})

  return sorting
}
