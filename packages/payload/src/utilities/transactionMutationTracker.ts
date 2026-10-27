import { AsyncLocalStorage } from 'node:async_hooks'

import type { BaseDatabaseAdapter } from '../database/types.js'
import type { PayloadRequest } from '../types/index.js'

type TransactionMutationState = {
  hasTransactionWrite: boolean
  parent: TransactionMutationState | undefined
}

export type TransactionMutationScope = {
  state: TransactionMutationState
}

const transactionMutationStorage = new AsyncLocalStorage<TransactionMutationState>()

const trackedDatabaseMutationMethod = Symbol('trackedDatabaseMutationMethod')

const databaseMutationMethodNames = [
  'create',
  'createGlobal',
  'createGlobalVersion',
  'createVersion',
  'deleteBranchGlobal',
  'deleteMany',
  'deleteOne',
  'deleteVersions',
  'updateGlobal',
  'updateGlobalVersion',
  'updateJobs',
  'updateMany',
  'updateOne',
  'updateVersion',
  'upsert',
  'upsertBranchGlobalChange',
] as const satisfies readonly (keyof BaseDatabaseAdapter)[]

type DatabaseMutationArguments = [
  {
    req?: Partial<PayloadRequest>
  },
  ...unknown[],
]

type DatabaseMutationMethod = ((...args: DatabaseMutationArguments) => Promise<unknown>) & {
  [trackedDatabaseMutationMethod]?: true
}

const trackDatabaseAdapterMutations = ({ adapter }: { adapter: BaseDatabaseAdapter }): void => {
  const adapterMethods = adapter as unknown as Record<PropertyKey, unknown>

  for (const methodName of databaseMutationMethodNames) {
    const databaseMutationMethod = adapterMethods[methodName] as DatabaseMutationMethod | undefined

    if (
      typeof databaseMutationMethod !== 'function' ||
      databaseMutationMethod[trackedDatabaseMutationMethod]
    ) {
      continue
    }

    const trackedMethod: DatabaseMutationMethod = async (...args) => {
      // Mark before invoking the adapter. A rejected multi-statement mutation can have written to
      // the ambient transaction before it failed, so a caught document error must still abort it.
      markTransactionWrite({ req: args[0]?.req })

      return Reflect.apply(databaseMutationMethod, adapter, args)
    }

    Object.defineProperty(trackedMethod, trackedDatabaseMutationMethod, { value: true })

    if (!Reflect.set(adapterMethods, methodName, trackedMethod)) {
      throw new TypeError(`Unable to track database mutation method "${methodName}".`)
    }
  }
}

export const runInTransactionMutationScope = async <Value>({
  adapter,
  callback,
}: {
  adapter?: BaseDatabaseAdapter
  callback: (scope: TransactionMutationScope) => Promise<Value>
}): Promise<Value> => {
  if (adapter) {
    trackDatabaseAdapterMutations({ adapter })
  }

  const state: TransactionMutationState = {
    hasTransactionWrite: false,
    parent: transactionMutationStorage.getStore(),
  }

  return transactionMutationStorage.run(state, () => callback({ state }))
}

export const hasTransactionWrite = ({ scope }: { scope: TransactionMutationScope }): boolean =>
  scope.state.hasTransactionWrite

export const markTransactionWrite = ({
  req,
}: {
  req: Partial<PayloadRequest> | undefined
}): void => {
  if (!req?.transactionID) {
    return
  }

  let state = transactionMutationStorage.getStore()

  while (state) {
    state.hasTransactionWrite = true
    state = state.parent
  }
}
