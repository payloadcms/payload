import type { SelectType, Sort, Where } from 'payload'

import { stringify } from 'qs-esm'

export type OperationArgs = {
  depth?: number
  draft?: boolean
  fallbackLocale?: false | string
  joins?: false | Record<string, unknown>
  limit?: number
  locale?: string
  page?: number
  populate?: Record<string, unknown>
  select?: SelectType
  sort?: Sort
  where?: Where
}

export const buildSearchParams = (args: OperationArgs): string => {
  const search: Record<string, unknown> = {}

  if (typeof args.depth === 'number') {
    search.depth = String(args.depth)
  }

  if (typeof args.page === 'number') {
    search.page = String(args.page)
  }

  if (typeof args.limit === 'number') {
    search.limit = String(args.limit)
  }

  if (typeof args.draft === 'boolean') {
    search.draft = String(args.draft)
  }

  if (args.fallbackLocale) {
    search['fallback-locale'] = String(args.fallbackLocale)
  }

  if (args.locale) {
    search.locale = args.locale
  }

  if (args.sort) {
    const sanitizedSort = Array.isArray(args.sort) ? args.sort.join(',') : args.sort
    search.sort = sanitizedSort
  }

  if (args.select) {
    search.select = args.select
  }

  if (args.where) {
    search.where = args.where
  }

  if (args.populate) {
    search.populate = args.populate
  }

  if (args.joins) {
    search.joins = args.joins
  }

  if (Object.keys(search).length > 0) {
    return stringify(search, { addQueryPrefix: true })
  }

  return ''
}
