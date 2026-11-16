import { describe, expect, it } from 'vitest'

import { createAuthSessionRequests } from './authSessionRequests.js'

describe('createAuthSessionRequests', () => {
  it('should serialize auth requests in queue order', async () => {
    const authRequests = createAuthSessionRequests()
    const first = createDeferred<void>()
    const order: string[] = []

    const firstRequest = authRequests.queue(async () => {
      order.push('first:start')
      await first.promise
      order.push('first:end')
    })
    const secondRequest = authRequests.queue(async () => {
      order.push('second')
    })

    expect(order).toEqual([])
    await Promise.resolve()
    expect(order).toEqual(['first:start'])

    first.resolve()
    await Promise.all([firstRequest, secondRequest])
    expect(order).toEqual(['first:start', 'first:end', 'second'])
  })

  it('should share a refresh while session results remain current', async () => {
    const authRequests = createAuthSessionRequests()
    const refresh = createDeferred<null>()
    let runs = 0
    const run = () =>
      authRequests.refresh(async () => {
        runs += 1
        return refresh.promise
      })

    const first = run()
    const second = run()
    expect(first).toBe(second)

    refresh.resolve(null)
    await Promise.all([first, second])
    expect(runs).toBe(1)
  })

  it('should discard a queued result after the session changes', async () => {
    const authRequests = createAuthSessionRequests()
    const operation = createDeferred<void>()
    let isResultStaleAfterSettlement = false

    const request = authRequests.queue(async ({ isResultStale }) => {
      await operation.promise
      isResultStaleAfterSettlement = isResultStale()
    })

    await Promise.resolve()
    authRequests.discardPendingResults()
    operation.resolve()
    await request

    expect(isResultStaleAfterSettlement).toBe(true)
  })

  it('should settle a logout once and prevent refresh from committing', async () => {
    const authRequests = createAuthSessionRequests()
    const logout = createDeferred<void>()
    let clears = 0
    let logoutRequests = 0

    const first = authRequests.logOut({
      clearSession: () => {
        clears += 1
        authRequests.discardPendingResults()
      },
      request: async () => {
        logoutRequests += 1
        await logout.promise
      },
    })
    const second = authRequests.logOut({
      clearSession: () => {
        clears += 1
      },
      request: async () => {
        logoutRequests += 1
      },
    })

    expect(first).toBe(second)
    expect(authRequests.isLoggingOut()).toBe(true)
    expect(await authRequests.refresh(async () => null)).toBeNull()
    logout.resolve()
    await first
    expect({ clears, logoutRequests }).toEqual({ clears: 1, logoutRequests: 1 })
  })

  it('should discard a deferred invalidation after the session changes', async () => {
    const authRequests = createAuthSessionRequests()
    let invalidations = 0

    const first = authRequests.refresh(async ({ invalidateWhenIdle }) => {
      invalidateWhenIdle(() => {
        invalidations += 1
      })
      return null
    })
    const second = authRequests.queue(async () => {
      authRequests.discardPendingResults()
    })

    await Promise.all([first, second])
    expect(invalidations).toBe(0)
  })
})

function createDeferred<Value>(): {
  promise: Promise<Value>
  resolve: (value: Value | PromiseLike<Value>) => void
} {
  let resolve: ((value: Value | PromiseLike<Value>) => void) | undefined
  const promise = new Promise<Value>((resolvePromise) => {
    resolve = resolvePromise
  })

  if (!resolve) {
    throw new Error('Expected deferred promise resolver.')
  }

  return { promise, resolve }
}
