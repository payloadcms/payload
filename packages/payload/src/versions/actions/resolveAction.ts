import { status as httpStatus } from 'http-status'

import type { JsonObject } from '../../types/index.js'
import type {
  CanonicalizeWriteStatusArgs,
  CreateAction,
  ResolveActionArgs,
  RestoreAction,
  UpdateAction,
  WriteAction,
  WriteOperation,
} from './types.js'

import { APIError } from '../../errors/APIError.js'
import { deepCopyObjectSimple } from '../../utilities/deepCopyObject.js'

type DocumentStatus = 'draft' | 'published'

/**
 * Resolves the effective write action from explicit `action`, recognized `_status`, and the
 * operation default. Returns `undefined` for ordinary writes on entities without drafts.
 *
 * Modifier flags (`autosave`, `publishAllLocales`, `unpublishAllLocales`) are validated against
 * the resolved action so collection and global operations share one contract.
 */
export function resolveAction({
  action: requestedAction,
  autosave,
  draftsEnabled,
  locale,
  operation,
  publishAllLocales,
  status,
  unpublishAllLocales,
}: ResolveActionArgs): CreateAction | RestoreAction | undefined | UpdateAction {
  const explicitAction = parseExplicitAction({ action: requestedAction, operation })

  if (!draftsEnabled) {
    return resolveNonDraftAction({
      action: explicitAction,
      autosave,
      unpublishAllLocales,
    })
  }

  const resolvedAction =
    explicitAction ?? inferActionFromStatus({ locale, status }) ?? defaultAction(operation)

  validateModifiers({
    action: resolvedAction,
    autosave,
    publishAllLocales,
    unpublishAllLocales,
  })

  return resolvedAction
}

/**
 * Writes the status required by a resolved action onto a core-owned copy of write data.
 * Does not mutate the caller's object. When `action` is `undefined`, the original data is returned.
 */
export function canonicalizeWriteStatus<T extends object>({
  action,
  data,
  locale,
  publishAllLocales,
  unpublishAllLocales,
}: CanonicalizeWriteStatusArgs<T>): T {
  const nextStatus = statusFromAction(action)

  if (nextStatus === undefined) {
    return data
  }

  const nextData = deepCopyObjectSimple(data as JsonObject) as T
  const currentStatus = getDataStatus(data)

  if (isLocalizedStatus(currentStatus)) {
    const localizedStatus = { ...currentStatus }

    if (publishAllLocales || unpublishAllLocales || locale === 'all') {
      for (const localeCode of Object.keys(localizedStatus)) {
        localizedStatus[localeCode] = nextStatus
      }
    } else if (locale) {
      localizedStatus[locale] = nextStatus
    } else {
      ;(nextData as JsonObject)._status = nextStatus
      return nextData
    }

    ;(nextData as JsonObject)._status = localizedStatus
    return nextData
  }

  ;(nextData as JsonObject)._status = nextStatus
  return nextData
}

export function statusFromAction(action: undefined | WriteAction): DocumentStatus | undefined {
  if (action === undefined) {
    return undefined
  }

  switch (action) {
    case 'publish':
      return 'published'
    case 'saveDraft':
    case 'unpublish':
      return 'draft'
    default: {
      const exhaustive: never = action
      return exhaustive
    }
  }
}

function parseExplicitAction({
  action,
  operation,
}: {
  action: unknown
  operation: WriteOperation
}): undefined | WriteAction {
  if (action === undefined || action === null) {
    return undefined
  }

  if (typeof action !== 'string') {
    throw invalidAction({ action, operation })
  }

  switch (operation) {
    case 'create':
    case 'duplicate':
      switch (action) {
        case 'publish':
        case 'saveDraft':
          return action
        default:
          throw invalidAction({ action, operation })
      }
    case 'restore':
      switch (action) {
        case 'publish':
        case 'saveDraft':
          return action
        default:
          throw invalidAction({ action, operation })
      }
    case 'update':
      switch (action) {
        case 'publish':
        case 'saveDraft':
        case 'unpublish':
          return action
        default:
          throw invalidAction({ action, operation })
      }
    default: {
      const exhaustive: never = operation
      throw new APIError(`Invalid write operation "${String(exhaustive)}".`, httpStatus.BAD_REQUEST)
    }
  }
}

function resolveNonDraftAction({
  action,
  autosave,
  unpublishAllLocales,
}: {
  action: undefined | WriteAction
  autosave?: boolean
  unpublishAllLocales?: boolean
}): undefined {
  if (action === 'saveDraft' || action === 'unpublish') {
    throw new APIError(
      `The action "${action}" cannot be used because drafts are not enabled.`,
      httpStatus.BAD_REQUEST,
    )
  }

  if (autosave) {
    throw new APIError(
      'autosave is only valid when the resolved action is "saveDraft".',
      httpStatus.BAD_REQUEST,
    )
  }

  if (unpublishAllLocales) {
    throw new APIError(
      'unpublishAllLocales is only valid when the resolved action is "unpublish".',
      httpStatus.BAD_REQUEST,
    )
  }

  return undefined
}

function inferActionFromStatus({
  locale,
  status,
}: {
  locale?: string
  status: unknown
}): 'publish' | 'saveDraft' | undefined {
  const recognized = recognizedStatus({ locale, status })

  switch (recognized) {
    case 'draft':
      return 'saveDraft'
    case 'published':
      return 'publish'
    default:
      return undefined
  }
}

function recognizedStatus({
  locale,
  status,
}: {
  locale?: string
  status: unknown
}): DocumentStatus | undefined {
  if (status === 'draft' || status === 'published') {
    return status
  }

  if (!isLocalizedStatus(status) || !locale || locale === 'all') {
    return undefined
  }

  const localeStatus = status[locale]
  if (localeStatus === 'draft' || localeStatus === 'published') {
    return localeStatus
  }

  return undefined
}

function defaultAction(operation: WriteOperation): CreateAction | RestoreAction | UpdateAction {
  switch (operation) {
    case 'create':
    case 'duplicate':
      return 'saveDraft'
    case 'restore':
    case 'update':
      return 'publish'
    default: {
      const exhaustive: never = operation
      return exhaustive
    }
  }
}

function validateModifiers({
  action,
  autosave,
  publishAllLocales,
  unpublishAllLocales,
}: {
  action: WriteAction
  autosave?: boolean
  publishAllLocales?: boolean
  unpublishAllLocales?: boolean
}): void {
  if (publishAllLocales && unpublishAllLocales) {
    throw new APIError(
      'publishAllLocales and unpublishAllLocales cannot both be true.',
      httpStatus.BAD_REQUEST,
    )
  }

  if (autosave && action !== 'saveDraft') {
    throw new APIError(
      'autosave is only valid when the resolved action is "saveDraft".',
      httpStatus.BAD_REQUEST,
    )
  }

  if (publishAllLocales && action !== 'publish') {
    throw new APIError(
      'publishAllLocales is only valid when the resolved action is "publish".',
      httpStatus.BAD_REQUEST,
    )
  }

  if (unpublishAllLocales && action !== 'unpublish') {
    throw new APIError(
      'unpublishAllLocales is only valid when the resolved action is "unpublish".',
      httpStatus.BAD_REQUEST,
    )
  }
}

function invalidAction({
  action,
  operation,
}: {
  action: unknown
  operation: WriteOperation
}): APIError {
  return new APIError(
    `Invalid action ${JSON.stringify(action)}. Valid actions for ${operation} are: ${validActionsForOperation(operation).join(', ')}.`,
    httpStatus.BAD_REQUEST,
  )
}

function validActionsForOperation(operation: WriteOperation): WriteAction[] {
  switch (operation) {
    case 'create':
    case 'duplicate':
    case 'restore':
      return ['saveDraft', 'publish']
    case 'update':
      return ['saveDraft', 'publish', 'unpublish']
    default: {
      const exhaustive: never = operation
      return exhaustive
    }
  }
}

function isLocalizedStatus(status: unknown): status is Record<string, unknown> {
  return typeof status === 'object' && status !== null && !Array.isArray(status)
}

function getDataStatus(data: object): unknown {
  if ('_status' in data) {
    return data._status
  }

  return undefined
}
