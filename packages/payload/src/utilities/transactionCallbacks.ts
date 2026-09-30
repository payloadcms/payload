import type { MarkRequired } from 'ts-essentials'

import type { PayloadRequest } from '../types/index.js'

type TransactionCallback = () => Promise<void>
type TransactionID = number | string
export type DeferredCleanupScope = {
  callbacks: TransactionCallback[]
  database: object
  parent: DeferredCleanupScope | null
  startIndex: number
  state: 'collecting' | 'flushing'
  transactionID?: TransactionID
}

const callbacksByDatabase = new WeakMap<object, Map<TransactionID, TransactionCallback[]>>()
const deferredCleanupScopeContextKey = '_payloadDeferredCleanupScope'

/**
 * Marks the current callback position so an operation can remove only the cleanup it registered.
 * Transaction callbacks remain queued until commit. A root scope without a transaction runs its
 * callbacks when the operation flushes it.
 */
export const beginDeferredCleanupScope = async ({
  req,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
}): Promise<DeferredCleanupScope> => {
  const transactionID = await resolveTransactionID({ req })

  return createDeferredCleanupScope({ req, transactionID })
}

/** Reuses an operation scope when a low-level cleanup helper does not need its own savepoint. */
export const beginDeferredCleanupScopeIfNeeded = async ({
  req,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
}): Promise<DeferredCleanupScope | null> => {
  const transactionID = await resolveTransactionID({ req })
  const activeScope = req.context?.[deferredCleanupScopeContextKey] as
    | DeferredCleanupScope
    | undefined

  if (
    activeScope?.database === req.payload.db &&
    activeScope.transactionID === (transactionID || undefined)
  ) {
    return null
  }

  return createDeferredCleanupScope({ req, transactionID })
}

const createDeferredCleanupScope = ({
  req,
  transactionID,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
  transactionID?: TransactionID
}): DeferredCleanupScope => {
  req.context ??= {}
  const parent = (req.context[deferredCleanupScopeContextKey] as DeferredCleanupScope) ?? null
  const callbacks = transactionID
    ? getTransactionCallbacks({ database: req.payload.db, transactionID })
    : parent && parent.transactionID === undefined
      ? parent.callbacks
      : []
  const scope: DeferredCleanupScope = {
    callbacks,
    database: req.payload.db,
    parent,
    startIndex: callbacks.length,
    state: 'collecting',
    transactionID: transactionID || undefined,
  }

  req.context[deferredCleanupScopeContextKey] = scope

  return scope
}

const resolveTransactionID = async ({
  req,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
}): Promise<TransactionID | undefined> =>
  req.transactionID instanceof Promise ? await req.transactionID : req.transactionID

export const scheduleAfterTransactionCommit = async ({
  callback,
  req,
}: {
  callback: TransactionCallback
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
}): Promise<void> => {
  const pendingTransactionID = req.transactionID
  const transactionID =
    pendingTransactionID instanceof Promise ? await pendingTransactionID : pendingTransactionID

  if (!transactionID) {
    if (req.transactionID === pendingTransactionID) {
      delete req.transactionID
    }

    const scope = req.context?.[deferredCleanupScopeContextKey] as DeferredCleanupScope | undefined

    if (!scope || scope.transactionID !== undefined) {
      throw new Error('File cleanup requires an active transaction or deferred cleanup scope.')
    }

    if (scope.state === 'flushing') {
      await callback()
    } else {
      scope.callbacks.push(callback)
    }

    return
  }

  getTransactionCallbacks({ database: req.payload.db, transactionID }).push(callback)
}

export const runTransactionCommitCallbacks = async ({
  req,
  transactionID,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
  transactionID: TransactionID
}): Promise<void> => {
  const callbacksByTransaction = callbacksByDatabase.get(req.payload.db)
  const callbacks = callbacksByTransaction?.get(transactionID)

  if (!callbacks) {
    return
  }

  closeTransactionScopes({ req, transactionID })
  callbacksByTransaction!.delete(transactionID)

  if (callbacksByTransaction!.size === 0) {
    callbacksByDatabase.delete(req.payload.db)
  }

  await runCallbacks({ callbacks })
}

export const clearTransactionCommitCallbacks = ({
  req,
  transactionID,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
  transactionID: TransactionID
}): void => {
  const callbacksByTransaction = callbacksByDatabase.get(req.payload.db)

  closeTransactionScopes({ req, transactionID })
  callbacksByTransaction?.delete(transactionID)

  if (callbacksByTransaction?.size === 0) {
    callbacksByDatabase.delete(req.payload.db)
  }
}

export const flushDeferredCleanupScope = async ({
  req,
  scope,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
  scope: DeferredCleanupScope
}): Promise<void> => {
  if (req.context?.[deferredCleanupScopeContextKey] !== scope) {
    throw new Error('The deferred cleanup scope is no longer active.')
  }

  if (scope.transactionID !== undefined || scope.parent?.callbacks === scope.callbacks) {
    popScope({ req, scope })
    removeEmptyTransactionQueue({ scope })
    return
  }

  scope.state = 'flushing'
  const callbacks = scope.callbacks.splice(scope.startIndex)

  try {
    await runCallbacks({ callbacks })
  } finally {
    popScope({ req, scope })
  }
}

/**
 * Flushes cleanup after an operation's database work has completed. A cleanup failure cannot undo
 * that write, so report it with the same contract used after a committed transaction.
 */
export const flushDeferredCleanupScopeAfterOperation = async ({
  req,
  scope,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
  scope: DeferredCleanupScope
}): Promise<void> => {
  try {
    await flushDeferredCleanupScope({ req, scope })
  } catch (err) {
    req.payload.logger.error({ err, msg: 'A post-commit cleanup task failed.' })
  }
}

export const clearDeferredCleanupScope = ({
  req,
  scope,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
  scope: DeferredCleanupScope
}): void => {
  scope.callbacks.splice(scope.startIndex)
  popScope({ req, scope })
  removeEmptyTransactionQueue({ scope })
}

const getTransactionCallbacks = ({
  database,
  transactionID,
}: {
  database: object
  transactionID: TransactionID
}): TransactionCallback[] => {
  const callbacksByTransaction = callbacksByDatabase.get(database) ?? new Map()
  const callbacks = callbacksByTransaction.get(transactionID) ?? []

  callbacksByTransaction.set(transactionID, callbacks)
  callbacksByDatabase.set(database, callbacksByTransaction)

  return callbacks
}

const removeEmptyTransactionQueue = ({ scope }: { scope: DeferredCleanupScope }): void => {
  if (
    scope.transactionID === undefined ||
    scope.callbacks.length > 0 ||
    scope.parent?.callbacks === scope.callbacks
  ) {
    return
  }

  const callbacksByTransaction = callbacksByDatabase.get(scope.database)

  callbacksByTransaction?.delete(scope.transactionID)

  if (callbacksByTransaction?.size === 0) {
    callbacksByDatabase.delete(scope.database)
  }
}

const popScope = ({
  req,
  scope,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
  scope: DeferredCleanupScope
}): void => {
  if (req.context?.[deferredCleanupScopeContextKey] !== scope) {
    return
  }

  if (scope.parent) {
    req.context[deferredCleanupScopeContextKey] = scope.parent
  } else {
    delete req.context[deferredCleanupScopeContextKey]
  }
}

const closeTransactionScopes = ({
  req,
  transactionID,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
  transactionID: TransactionID
}): void => {
  const scope = req.context?.[deferredCleanupScopeContextKey] as DeferredCleanupScope | undefined

  if (scope?.transactionID === transactionID) {
    popScope({ req, scope })
    closeTransactionScopes({ req, transactionID })
  }
}

const runCallbacks = async ({ callbacks }: { callbacks: TransactionCallback[] }): Promise<void> => {
  const errors: unknown[] = []

  for (const callback of callbacks) {
    try {
      await callback()
    } catch (error) {
      errors.push(error)
    }
  }

  if (errors.length === 1) {
    throw errors[0]
  }

  if (errors.length > 1) {
    throw new AggregateError(errors, 'Multiple deferred cleanup callbacks failed.')
  }
}
