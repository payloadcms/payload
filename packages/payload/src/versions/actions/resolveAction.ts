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

type ActionForOperation = {
  create: CreateAction
  duplicate: CreateAction
  restore: RestoreAction
  update: UpdateAction
}

type OperationPolicies = {
  [TOperation in WriteOperation]: {
    defaultAction: ActionForOperation[TOperation]
    validActions: readonly ActionForOperation[TOperation][]
  }
}

const operationPolicies = {
  create: {
    defaultAction: 'saveDraft',
    validActions: ['saveDraft', 'publish'],
  },
  duplicate: {
    defaultAction: 'saveDraft',
    validActions: ['saveDraft', 'publish'],
  },
  restore: {
    defaultAction: 'publish',
    validActions: ['saveDraft', 'publish'],
  },
  update: {
    defaultAction: 'publish',
    validActions: ['saveDraft', 'publish', 'unpublish'],
  },
} as const satisfies OperationPolicies

/**
 * Resolves the effective write action from explicit `action`, recognized `_status`, and the
 * operation default. Returns `undefined` for ordinary writes on entities without drafts.
 *
 * The `autosave` modifier is validated against the resolved action so collection and global
 * operations share one contract.
 */
export function resolveAction({
  action: requestedAction,
  autosave,
  draftsEnabled,
  locale,
  operation,
  status,
}: ResolveActionArgs): CreateAction | RestoreAction | undefined | UpdateAction {
  const explicitAction = parseExplicitAction({ action: requestedAction, operation })

  if (!draftsEnabled) {
    return resolveNonDraftAction({
      action: explicitAction,
      autosave,
    })
  }

  const resolvedAction =
    explicitAction ??
    inferActionFromStatus({ locale, status }) ??
    operationPolicies[operation].defaultAction

  validateAllLocaleTransition({
    explicitAction,
    locale,
    resolvedAction,
  })

  validateModifiers({ action: resolvedAction, autosave })

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
}: CanonicalizeWriteStatusArgs<T>): T {
  const nextStatus = statusFromAction({ action })

  if (nextStatus === undefined) {
    return data
  }

  const nextData = deepCopyObjectSimple(data as JsonObject) as T
  const currentStatus = getDataStatus(data)

  if (isLocalizedStatus(currentStatus)) {
    const localizedStatus = { ...currentStatus }

    if (locale === 'all') {
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

export function statusFromAction({
  action,
}: {
  action: undefined | WriteAction
}): DocumentStatus | undefined {
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

function validateAllLocaleTransition({
  explicitAction,
  locale,
  resolvedAction,
}: {
  explicitAction: undefined | WriteAction
  locale?: null | string
  resolvedAction: WriteAction
}): void {
  if (
    locale !== 'all' ||
    resolvedAction === 'saveDraft' ||
    explicitAction === 'publish' ||
    explicitAction === 'unpublish'
  ) {
    return
  }

  throw new APIError(
    'Publishing all locales requires an explicit "publish" action.',
    httpStatus.BAD_REQUEST,
  )
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

  const isValidAction = operationPolicies[operation].validActions.some(
    (validAction) => validAction === action,
  )

  if (!isValidAction) {
    throw invalidAction({ action, operation })
  }

  return action as WriteAction
}

function resolveNonDraftAction({
  action,
  autosave,
}: {
  action: undefined | WriteAction
  autosave?: boolean
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

  return undefined
}

function inferActionFromStatus({
  locale,
  status,
}: {
  locale?: null | string
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
  locale?: null | string
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

function validateModifiers({
  action,
  autosave,
}: {
  action: WriteAction
  autosave?: boolean
}): void {
  if (autosave && action !== 'saveDraft') {
    throw new APIError(
      'autosave is only valid when the resolved action is "saveDraft".',
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
    `Invalid action ${JSON.stringify(action)}. Valid actions for ${operation} are: ${operationPolicies[operation].validActions.join(', ')}.`,
    httpStatus.BAD_REQUEST,
  )
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
