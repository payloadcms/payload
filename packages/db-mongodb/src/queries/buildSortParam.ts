import type { PaginateOptions } from 'mongoose'
import type { Field, SanitizedConfig } from 'payload'

import { getLocalizedSortProperty } from './getLocalizedSortProperty.js'

type Args = {
  config: SanitizedConfig
  fields: Field[]
  locale: string
  sort: string
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
  sort,
  timestamps,
}: Args): PaginateOptions['sort'] => {
  if (!sort) {
    if (timestamps) {
      sort = '-createdAt'
    } else {
      sort = '-id'
    }
  }

  const sorting = sort.split(',').reduce<PaginateOptions['sort']>((acc, item) => {
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
      segments: sortProperty.split('.'),
    })
    acc[localizedProperty] = sortDirection
    return acc
  }, {})

  return sorting
}
