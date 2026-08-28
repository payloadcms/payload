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
  fieldAccessDenied,
  fieldValue,
  status,
}: {
  data: JsonObject
  fieldAccessDenied: boolean
  fieldValue: unknown
  status: AllLocalesPublicationStatus | undefined
}): boolean => {
  return Boolean(status && !fieldAccessDenied && data._status === status && fieldValue === status)
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
