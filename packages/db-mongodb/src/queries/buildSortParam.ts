import type { PaginateOptions } from 'mongoose'
import type { SanitizedConfig } from 'payload/config'
import type { Field } from 'payload/types'

import { getLocalizedSortProperty } from './getLocalizedSortProperty'

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
