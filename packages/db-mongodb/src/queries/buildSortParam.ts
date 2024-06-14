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
  let sortProperty: string
  let sortDirection: SortDirection = 'desc'

  if (!sort) {
    if (timestamps) {
      sortProperty = 'createdAt'
    } else {
      sortProperty = '_id'
    }
  } else if (sort.indexOf('-') === 0) {
    sortProperty = sort.substring(1)
  } else {
    sortProperty = sort
    sortDirection = 'asc'
  }

  if (sortProperty === 'id') {
    sortProperty = '_id'
  } else {
    sortProperty = getLocalizedSortProperty({
      config,
      fields,
      locale,
      segments: sortProperty.split('.'),
    })
  }

  return { [sortProperty]: sortDirection }
}
