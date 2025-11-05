import type { JoinQuery, PopulateType, SelectType, Where } from '../types/index.js'
import type { JoinParams } from './sanitizeJoinParams.js'

import { isNumber } from './isNumber.js'
import { parseBooleanString } from './parseBooleanString.js'
import { sanitizeJoinParams } from './sanitizeJoinParams.js'
import { sanitizePopulateParam } from './sanitizePopulateParam.js'
import { sanitizeSelectParam } from './sanitizeSelectParam.js'

type ParsedParams = {
  autosave?: boolean
  data?: Record<string, unknown>
  depth?: number
  draft?: boolean
  field?: string
  flattenLocales?: boolean
  joins?: JoinQuery
  limit?: number
  overrideLock?: boolean
  page?: number
  pagination?: boolean
  populate?: PopulateType
  publishSpecificLocale?: string
  select?: SelectType
  selectedLocales?: string[]
  sort?: string[]
  trash?: boolean
  where?: Where
} & Record<string, unknown>

type RawParams = {
  [key: string]: unknown
  autosave?: string
  data?: string
  depth?: string
  draft?: string
  field?: string
  flattenLocales?: string
  joins?: JoinParams
  limit?: string
  overrideLock?: string
  page?: string
  pagination?: string
  populate?: unknown
  publishSpecificLocale?: string
  select?: unknown
  selectedLocales?: string
  sort?: string
  trash?: string
  where?: Where
}

export const parseParams = (params: RawParams): ParsedParams => {
  const knownBooleanParams = [
    'autosave',
    'draft',
    'trash',
    'overrideLock',
    'pagination',
    'flattenLocales',
  ]
  const knownNumberParams = ['depth', 'limit', 'page']

  const parsedParams: ParsedParams = {}

  // iterate through known params to make this very fast
  for (const key of knownBooleanParams) {
    if (key in params) {
      parsedParams[key] = parseBooleanString(params[key] as string)
    }
  }

  for (const key of knownNumberParams) {
    if (key in params) {
      if (isNumber(params[key])) {
        parsedParams[key] = Number(params[key])
      }
    }
  }

  if ('populate' in params) {
    parsedParams.populate = sanitizePopulateParam(params.populate)
  }

  if ('select' in params) {
    parsedParams.select = sanitizeSelectParam(params.select)
  }

  if ('joins' in params) {
    parsedParams.joins = sanitizeJoinParams(params.joins as JoinParams)
  }

  if ('sort' in params) {
    parsedParams.sort = typeof params.sort === 'string' ? params.sort.split(',') : undefined
  }

  if ('data' in params) {
    parsedParams.data = JSON.parse(params.data || '')
  }

  return parsedParams
}
