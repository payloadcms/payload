import type { Sort, Where } from 'payload'

import { stringify } from 'qs-esm'

export type OperationArgs = {
  action?: string
  depth?: number
  fallbackLocale?: unknown
  joins?: false | Record<string, unknown>
  limit?: number
  locale?: unknown
  page?: number
  pagination?: boolean
  populate?: Record<string, unknown>
  select?: unknown
  sort?: Sort
  trash?: boolean
  version?: string
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

  if (typeof args.version === 'string') {
    search.version = args.version
  }

  if (typeof args.action === 'string') {
    search.action = args.action
  }

  if (typeof args.trash === 'boolean') {
    search.trash = String(args.trash)
  }

  if (typeof args.pagination === 'boolean') {
    search.pagination = String(args.pagination)
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
    // @ts-expect-error allowEmptyArrays is not in the type definition for qs-esm, but it is supported
    return stringify(search, { addQueryPrefix: true, allowEmptyArrays: true })
  }

  return ''
}
