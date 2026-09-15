import { status as httpStatus } from 'http-status'

import type { JoinQuery, PopulateType, SelectType, Where } from '../../types/index.js'
import type {
  CreateAction,
  RestoreAction,
  UpdateAction,
  WriteAction,
} from '../../versions/actions/types.js'
import type { ReadVersion } from '../../versions/types.js'
import type { JoinParams } from '../sanitizeJoinParams.js'

import { APIError } from '../../errors/APIError.js'
import { isNumber } from '../isNumber.js'
import { parseBooleanString } from '../parseBooleanString.js'
import { sanitizeJoinParams } from '../sanitizeJoinParams.js'
import { sanitizePopulateParam } from '../sanitizePopulateParam.js'
import { sanitizeSelectParam } from '../sanitizeSelectParam.js'
import { sanitizeSortParams } from '../sanitizeSortParams.js'

export const readVersionValues = [
  'published',
  'latest',
  'draft',
] as const satisfies readonly ReadVersion[]

export const createActionValues = [
  'publish',
  'saveDraft',
] as const satisfies readonly CreateAction[]

export const updateActionValues = [
  'publish',
  'saveDraft',
  'unpublish',
] as const satisfies readonly UpdateAction[]

export const restoreActionValues = [
  'publish',
  'saveDraft',
] as const satisfies readonly RestoreAction[]

export const writeActionValues = [
  'publish',
  'saveDraft',
  'unpublish',
] as const satisfies readonly WriteAction[]

export type RawParams = {
  [key: string]: unknown
  action?: string | string[]
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
  publishAllLocales?: string
  select?: unknown
  selectedLocales?: string
  sort?: string | string[]
  trash?: string
  unpublishAllLocales?: string
  version?: string | string[]
  where?: string | Where
}

export type ParsedParams = {
  action?: WriteAction
  autosave?: boolean
  data?: Record<string, unknown>
  depth?: number
  field?: string
  flattenLocales?: boolean
  joins?: JoinQuery
  limit?: number
  overrideLock?: boolean
  page?: number
  pagination?: boolean
  populate?: PopulateType
  publishAllLocales?: boolean
  select?: SelectType
  selectedLocales?: string[]
  sort?: string[]
  trash?: boolean
  unpublishAllLocales?: boolean
  version?: ReadVersion
  where?: Where
} & Record<string, unknown>

export const booleanParams = ['autosave', 'trash', 'overrideLock', 'pagination', 'flattenLocales']

export const numberParams = ['depth', 'limit', 'page']

export type ParseEnumParamArgs<T extends string> = {
  allowed: readonly T[]
  param: string
  value: unknown
}

/**
 * Parses an exact enum query value. Repeated values, invalid casing, and unknown strings throw 400.
 */
export function parseEnumParam<T extends string>({
  allowed,
  param,
  value,
}: ParseEnumParamArgs<T>): T | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) {
    return value as T
  }

  throw new APIError(
    `Invalid ${param} ${JSON.stringify(value)}. Valid values are: ${allowed.join(', ')}.`,
    httpStatus.BAD_REQUEST,
  )
}

/**
 * Takes raw query parameters and parses them into the correct types that Payload expects.
 * Examples:
 *   a. `autosave` provided as a string of "true" is converted to a boolean
 *   b. `depth` provided as a string of "0" is converted to a number
 *   c. `sort` provided as a comma-separated string or array is converted to an array of strings
 *   d. `version` and `action` are validated as exact enum strings
 */
export const parseParams = (params: RawParams): ParsedParams => {
  if ('draft' in params) {
    throw new APIError(
      'The query parameter "draft" is no longer supported. Use "version" for reads and "action" for writes.',
      httpStatus.BAD_REQUEST,
    )
  }

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

  if ('where' in params && typeof params.where === 'string' && params.where.length > 0) {
    parsedParams.where = JSON.parse(params.where) as Where
  }

  if ('version' in params) {
    parsedParams.version = parseEnumParam({
      allowed: readVersionValues,
      param: 'version',
      value: params.version,
    })
  }

  if ('action' in params) {
    parsedParams.action = parseEnumParam({
      allowed: writeActionValues,
      param: 'action',
      value: params.action,
    })
  }

  return parsedParams
}
