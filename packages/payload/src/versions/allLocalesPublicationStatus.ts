import { status as httpStatus } from 'http-status'

import type { JsonObject } from '../types/index.js'

import { APIError } from '../errors/index.js'

export type AllLocalesPublicationStatus = 'draft' | 'published'

export const getAllLocalesPublicationStatus = ({
  hasLocalizedStatus,
  publishAllLocales,
  unpublishAllLocales,
}: {
  hasLocalizedStatus: boolean
  publishAllLocales: boolean
  unpublishAllLocales: boolean
}): AllLocalesPublicationStatus | undefined => {
  if (!hasLocalizedStatus) {
    return undefined
  }

  if (unpublishAllLocales) {
    return 'draft'
  }

  if (publishAllLocales) {
    return 'published'
  }

  return undefined
}

export const hasAuthorizedAllLocalesPublicationStatus = ({
  data,
  locale,
  localeCodes,
  result,
  status,
}: {
  data: JsonObject
  locale: string
  localeCodes: string[]
  result: JsonObject
  status: AllLocalesPublicationStatus | undefined
}): boolean => {
  if (!status || data._status !== status) {
    return false
  }

  if (typeof result._status === 'string') {
    return result._status === status
  }

  if (typeof result._status !== 'object' || result._status === null) {
    return false
  }

  if (locale === 'all') {
    return localeCodes.every((localeCode) => result._status[localeCode] === status)
  }

  return result._status[locale] === status
}

export const validateAllLocalesPublicationFlags = ({
  publishAllLocales,
  unpublishAllLocales,
}: {
  publishAllLocales?: boolean
  unpublishAllLocales?: boolean
}): void => {
  if (publishAllLocales && unpublishAllLocales) {
    throw new APIError(
      'publishAllLocales and unpublishAllLocales cannot both be true.',
      httpStatus.BAD_REQUEST,
    )
  }
}
