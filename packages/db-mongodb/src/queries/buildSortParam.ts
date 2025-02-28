import type { FlattenedField, SanitizedConfig, Sort } from 'payload'

import { getLocalizedSortProperty } from './getLocalizedSortProperty.js'

type Args = {
  config: SanitizedConfig
  fields: FlattenedField[]
  locale?: string
  parentIsLocalized?: boolean
  sort: Sort
  timestamps: boolean
}

export type SortArgs = {
  direction: SortDirection
  property: string
}[]

export type SortDirection = 'asc' | 'desc'

export const buildSortParam = ({
  config,
  fields,
  locale,
  parentIsLocalized = false,
  sort,
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
