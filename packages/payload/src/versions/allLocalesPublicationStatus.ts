import { status as httpStatus } from 'http-status'

import type { JsonObject } from '../types/index.js'

import { APIError } from '../errors/index.js'

export type AllLocalesPublicationStatus = 'draft' | 'published'

type AllLocalesPublicationIntent = {
  hadStatus: boolean
  previousStatus: unknown
  status: AllLocalesPublicationStatus
}

export const buildAllLocalesPublicationHookDoc = <TDoc extends JsonObject>({
  doc,
  docWithLocales,
  status,
}: {
  doc: TDoc
  docWithLocales: JsonObject
  status: AllLocalesPublicationStatus | undefined
}): TDoc => {
  if (status && typeof docWithLocales._status === 'object' && docWithLocales._status !== null) {
    return {
      ...doc,
      _status: docWithLocales._status,
    } as TDoc
  }

  return doc
}

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

export const normalizeAllLocalesPublicationStatus = ({
  data,
  status,
}: {
  data: JsonObject
  status: AllLocalesPublicationStatus | undefined
}): AllLocalesPublicationIntent | undefined => {
  if (!status) {
    return undefined
  }

  const intent = {
    hadStatus: Object.prototype.hasOwnProperty.call(data, '_status'),
    previousStatus: data._status,
    status,
  }

  data._status = status

  return intent
}

export const reconcileAllLocalesPublicationStatus = ({
  data,
  intent,
  status,
}: {
  data: JsonObject
  intent: AllLocalesPublicationIntent | undefined
  status: AllLocalesPublicationStatus | undefined
}): AllLocalesPublicationStatus | undefined => {
  if (intent && intent.status !== status && data._status === intent.status) {
    if (intent.hadStatus) {
      data._status = intent.previousStatus
    } else {
      delete data._status
    }
  }

  return status && data._status === status ? status : undefined
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
