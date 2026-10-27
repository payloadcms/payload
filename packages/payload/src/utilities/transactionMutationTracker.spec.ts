import type { BaseDatabaseAdapter } from '../database/types.js'
import type { PayloadRequest } from '../types/index.js'

import { expect, it, vi } from 'vitest'

import {
  hasTransactionWrite,
  markTransactionWrite,
  runInTransactionMutationScope,
} from './transactionMutationTracker.js'

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
] as const

const createAdapterWithMethod = ({
  implementation,
  methodName,
}: {
  implementation: (...args: unknown[]) => Promise<unknown>
  methodName: (typeof databaseMutationMethodNames)[number] | 'find'
}): BaseDatabaseAdapter =>
  ({
    [methodName]: implementation,
  }) as unknown as BaseDatabaseAdapter

const invokeAdapterMethod = async ({
  adapter,
  methodName,
  req = { transactionID: 'transaction' },
}: {
  adapter: BaseDatabaseAdapter
  methodName: (typeof databaseMutationMethodNames)[number] | 'find'
  req?: Partial<PayloadRequest>
}): Promise<unknown> => {
  const method = (adapter as unknown as Record<string, (...args: unknown[]) => Promise<unknown>>)[
    methodName
  ]

  return method({ req })
}

it('should isolate overlapping transaction mutation scopes', async () => {
  let releaseFirstScope: () => void = () => undefined
  const firstScopeCanFinish = new Promise<void>((resolve) => {
    releaseFirstScope = resolve
  })
  const firstScope = runInTransactionMutationScope({
    callback: async (scope) => {
      await firstScopeCanFinish

      return hasTransactionWrite({ scope })
    },
  })
  const secondScope = runInTransactionMutationScope({
    callback: async (scope) => {
      markTransactionWrite({ req: { transactionID: 'transaction' } })

      return hasTransactionWrite({ scope })
    },
  })

  expect(await secondScope).toBe(true)
  releaseFirstScope()
  expect(await firstScope).toBe(false)
})

it('should mark every active parent transaction mutation scope', async () => {
  await runInTransactionMutationScope({
    callback: async (outerScope) => {
      await runInTransactionMutationScope({
        callback: async (innerScope) => {
          markTransactionWrite({ req: { transactionID: 'transaction' } })

          expect(hasTransactionWrite({ scope: innerScope })).toBe(true)
        },
      })

      expect(hasTransactionWrite({ scope: outerScope })).toBe(true)
    },
  })
})

it('should not mark a write that does not use an ambient request transaction', async () => {
  await runInTransactionMutationScope({
    callback: async (scope) => {
      markTransactionWrite({ req: {} })

      expect(hasTransactionWrite({ scope })).toBe(false)
    },
  })
})

it.each(databaseMutationMethodNames)(
  'should track the %s database adapter mutation method',
  async (methodName) => {
    let adapter: BaseDatabaseAdapter
    const resultValue = { methodName }
    const implementation = vi.fn(async function (this: BaseDatabaseAdapter) {
      expect(this).toBe(adapter)

      return resultValue
    })

    adapter = createAdapterWithMethod({ implementation, methodName })

    await runInTransactionMutationScope({
      adapter,
      callback: async (scope) => {
        await expect(invokeAdapterMethod({ adapter, methodName })).resolves.toBe(resultValue)
        expect(hasTransactionWrite({ scope })).toBe(true)
      },
    })

    expect(implementation).toHaveBeenCalledOnce()
  },
)

it('should track a rejected database mutation because it can have partially written', async () => {
  const mutationError = new Error('Mutation failed')
  const adapter = createAdapterWithMethod({
    implementation: vi.fn().mockRejectedValue(mutationError),
    methodName: 'updateOne',
  })

  await runInTransactionMutationScope({
    adapter,
    callback: async (scope) => {
      await expect(invokeAdapterMethod({ adapter, methodName: 'updateOne' })).rejects.toBe(
        mutationError,
      )
      expect(hasTransactionWrite({ scope })).toBe(true)
    },
  })
})

it('should not track a database mutation without an ambient request transaction', async () => {
  const adapter = createAdapterWithMethod({
    implementation: vi.fn().mockResolvedValue(undefined),
    methodName: 'updateOne',
  })

  await runInTransactionMutationScope({
    adapter,
    callback: async (scope) => {
      await invokeAdapterMethod({ adapter, methodName: 'updateOne', req: {} })
      expect(hasTransactionWrite({ scope })).toBe(false)
    },
  })
})

it('should not track database reads', async () => {
  const adapter = createAdapterWithMethod({
    implementation: vi.fn().mockResolvedValue({ docs: [] }),
    methodName: 'find',
  })

  await runInTransactionMutationScope({
    adapter,
    callback: async (scope) => {
      await invokeAdapterMethod({ adapter, methodName: 'find' })
      expect(hasTransactionWrite({ scope })).toBe(false)
    },
  })
})

it('should decorate the same database mutation method only once', async () => {
  const implementation = vi.fn().mockResolvedValue('updated')
  const adapter = createAdapterWithMethod({ implementation, methodName: 'updateOne' })

  for (let run = 0; run < 2; run++) {
    await runInTransactionMutationScope({
      adapter,
      callback: async (scope) => {
        await invokeAdapterMethod({ adapter, methodName: 'updateOne' })
        expect(hasTransactionWrite({ scope })).toBe(true)
      },
    })
  }

  expect(implementation).toHaveBeenCalledTimes(2)
})
