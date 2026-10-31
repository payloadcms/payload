import type { MarkRequired } from 'ts-essentials'

import type { PayloadRequest } from '../types/index.js'

type TransactionCallback = () => Promise<void>
type TransactionCallbackEntry = {
  callback: TransactionCallback
  sequence: number
}
type TransactionID = number | string
export type DeferredCleanupScope = {
  callbacks: TransactionCallbackEntry[]
  database: object
  parent: DeferredCleanupScope | null
  state: 'closed' | 'collecting' | 'flushing'
  transactionID?: TransactionID
}

const callbacksByDatabase = new WeakMap<object, Map<TransactionID, TransactionCallbackEntry[]>>()
const rollbackCallbacksByDatabase = new WeakMap<
  object,
  Map<TransactionID, TransactionCallbackEntry[]>
>()
export const deferredCleanupScopeContextKey = '_payloadDeferredCleanupScope'
let nextTransactionCallbackSequence = 0

/** Creates a request context whose cleanup callbacks can be managed independently. */
export const createIsolatedDeferredCleanupContext = ({
  req,
}: {
  req: Partial<PayloadRequest>
}): PayloadRequest['context'] => {
  const sourceContext = req.context ?? {}
  const context: PayloadRequest['context'] = {}

  for (const key of Reflect.ownKeys(sourceContext)) {
    if (key === deferredCleanupScopeContextKey) {
      continue
    }

    const descriptor = Object.getOwnPropertyDescriptor(sourceContext, key)

    if (descriptor?.enumerable) {
      Object.defineProperty(context, key, descriptor)
    }
  }

  return context
}

export const hasActiveDeferredCleanupScope = ({ req }: { req: Partial<PayloadRequest> }): boolean =>
  Boolean(req.context?.[deferredCleanupScopeContextKey])

/**
 * Creates an operation-owned cleanup queue. Successful nested scopes transfer their cleanup to a
 * parent for the same database and transaction. Root transaction scopes transfer their cleanup to
 * the transaction queue. Failed scopes can therefore discard only the cleanup they still own.
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
  const scope: DeferredCleanupScope = {
    callbacks: [],
    database: req.payload.db,
    parent,
    state: 'collecting',
    transactionID: transactionID ?? undefined,
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
  const scope = req.context?.[deferredCleanupScopeContextKey] as DeferredCleanupScope | undefined
  const callbackEntry = {
    callback,
    sequence: nextTransactionCallbackSequence++,
  }

  if (scope?.database === req.payload.db && scope.transactionID === (transactionID ?? undefined)) {
    if (scope.state === 'flushing') {
      await callback()
    } else {
      scope.callbacks.push(callbackEntry)
    }

    return
  }

  if (!transactionID) {
    if (req.transactionID === pendingTransactionID) {
      delete req.transactionID
    }

    throw new Error('File cleanup requires an active transaction or deferred cleanup scope.')
  }

  getTransactionCallbacks({ database: req.payload.db, transactionID }).push(callbackEntry)
}

export const scheduleAfterTransactionRollback = async ({
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
    throw new Error('Rollback callbacks require an active transaction.')
  }

  getRollbackCallbacks({ database: req.payload.db, transactionID }).push({
    callback,
    sequence: nextTransactionCallbackSequence++,
  })
}

export const runTransactionCommitCallbacks = async ({
  req,
  transactionID,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
  transactionID: TransactionID
}): Promise<void> => {
  const callbacksByTransaction = callbacksByDatabase.get(req.payload.db)
  const callbacks = callbacksByTransaction?.get(transactionID) ?? []
  const scopedCallbacks = closeTransactionScopes({ req, transactionID })

  callbacksByTransaction?.delete(transactionID)

  if (callbacksByTransaction?.size === 0) {
    callbacksByDatabase.delete(req.payload.db)
  }

  if (callbacks.length === 0 && scopedCallbacks.length === 0) {
    return
  }

  await runCallbacks({ callbacks: [...callbacks, ...scopedCallbacks] })
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

export const runTransactionRollbackCallbacks = async ({
  req,
  transactionID,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
  transactionID: TransactionID
}): Promise<void> => {
  const callbacksByTransaction = rollbackCallbacksByDatabase.get(req.payload.db)
  const callbacks = callbacksByTransaction?.get(transactionID)

  if (!callbacks) {
    return
  }

  callbacksByTransaction!.delete(transactionID)

  if (callbacksByTransaction!.size === 0) {
    rollbackCallbacksByDatabase.delete(req.payload.db)
  }

  await runCallbacks({ callbacks })
}

export const clearTransactionRollbackCallbacks = ({
  req,
  transactionID,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
  transactionID: TransactionID
}): void => {
  const callbacksByTransaction = rollbackCallbacksByDatabase.get(req.payload.db)

  callbacksByTransaction?.delete(transactionID)

  if (callbacksByTransaction?.size === 0) {
    rollbackCallbacksByDatabase.delete(req.payload.db)
  }
}

export const flushDeferredCleanupScope = async ({
  req,
  scope,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
  scope: DeferredCleanupScope
}): Promise<void> => {
  if (scope.state === 'closed') {
    return
  }

  assertDeferredCleanupScopeIsActive({ req, scope })

  if (
    scope.parent?.database === scope.database &&
    scope.parent.transactionID === scope.transactionID
  ) {
    scope.parent.callbacks.push(...scope.callbacks)
    scope.callbacks.length = 0
    popScope({ req, scope })
    return
  }

  if (scope.transactionID !== undefined) {
    if (scope.callbacks.length > 0) {
      getTransactionCallbacks({
        database: scope.database,
        transactionID: scope.transactionID,
      }).push(...scope.callbacks)
    }
    scope.callbacks.length = 0
    popScope({ req, scope })
    return
  }

  scope.state = 'flushing'
  const callbacks = scope.callbacks.splice(0)

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
  if (scope.state !== 'closed') {
    assertDeferredCleanupScopeIsActive({ req, scope })
  }

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
  if (scope.state === 'closed') {
    return
  }

  assertDeferredCleanupScopeIsActive({ req, scope })
  scope.callbacks.length = 0
  popScope({ req, scope })
}

const assertDeferredCleanupScopeIsActive = ({
  req,
  scope,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
  scope: DeferredCleanupScope
}): void => {
  if (req.context?.[deferredCleanupScopeContextKey] !== scope) {
    throw new Error('The deferred cleanup scope is no longer active.')
  }
}

const getTransactionCallbacks = ({
  database,
  transactionID,
}: {
  database: object
  transactionID: TransactionID
}): TransactionCallbackEntry[] => {
  const callbacksByTransaction = callbacksByDatabase.get(database) ?? new Map()
  const callbacks = callbacksByTransaction.get(transactionID) ?? []

  callbacksByTransaction.set(transactionID, callbacks)
  callbacksByDatabase.set(database, callbacksByTransaction)

  return callbacks
}

const getRollbackCallbacks = ({
  database,
  transactionID,
}: {
  database: object
  transactionID: TransactionID
}): TransactionCallbackEntry[] => {
  const callbacksByTransaction = rollbackCallbacksByDatabase.get(database) ?? new Map()
  const callbacks = callbacksByTransaction.get(transactionID) ?? []

  callbacksByTransaction.set(transactionID, callbacks)
  rollbackCallbacksByDatabase.set(database, callbacksByTransaction)

  return callbacks
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

  scope.state = 'closed'
}

const closeTransactionScopes = ({
  req,
  transactionID,
}: {
  req: MarkRequired<Partial<PayloadRequest>, 'payload'>
  transactionID: TransactionID
}): TransactionCallbackEntry[] => {
  const scope = req.context?.[deferredCleanupScopeContextKey] as DeferredCleanupScope | undefined

  if (!scope || scope.transactionID !== transactionID) {
    return []
  }

  const callbacks = scope.callbacks.splice(0)

  popScope({ req, scope })

  return [...closeTransactionScopes({ req, transactionID }), ...callbacks]
}

const runCallbacks = async ({
  callbacks,
}: {
  callbacks: TransactionCallbackEntry[]
}): Promise<void> => {
  const errors: unknown[] = []

  for (const { callback } of callbacks.sort((a, b) => a.sequence - b.sequence)) {
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
