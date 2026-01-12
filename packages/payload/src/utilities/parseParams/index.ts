import type { JoinQuery, PopulateType, SelectType, Where } from '../../types/index.js'
import type { JoinParams } from '../sanitizeJoinParams.js'

import { isNumber } from '../isNumber.js'
import { parseBooleanString } from '../parseBooleanString.js'
import { sanitizeJoinParams } from '../sanitizeJoinParams.js'
import { sanitizePopulateParam } from '../sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../sanitizeSelectParam.js'
import { sanitizeSortParams } from '../sanitizeSortParams.js'

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
  sort?: string | string[]
  trash?: string
  where?: Where
}

export const booleanParams = [
  'autosave',
  'draft',
  'trash',
  'overrideLock',
  'pagination',
  'flattenLocales',
]

export const numberParams = ['depth', 'limit', 'page']

/**
 * Takes raw query parameters and parses them into the correct types that Payload expects.
 * Examples:
 *   a. `draft` provided as a string of "true" is converted to a boolean
 *   b. `depth` provided as a string of "0" is converted to a number
 *   c. `sort` provided as a comma-separated string or array is converted to an array of strings
 */
export const parseParams = (params: RawParams): ParsedParams => {
  const parsedParams = (params || {}) as ParsedParams

  // iterate through known params to make this very fast
  for (const key of booleanParams) {
    if (key in params) {
      parsedParams[key] = parseBooleanString(params[key] as boolean | string)
    }
  }

  for (const key of numberParams) {
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
    parsedParams.sort = sanitizeSortParams(params.sort)
  }

  if ('data' in params && typeof params.data === 'string' && params.data.length > 0) {
    parsedParams.data = JSON.parse(params.data)
  }

  return parsedParams
}
