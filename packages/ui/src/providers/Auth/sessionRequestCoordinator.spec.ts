import { describe, expect, it } from 'vitest'

import { createAuthSessionRequestCoordinator } from './sessionRequestCoordinator.js'

describe('createAuthSessionRequestCoordinator', () => {
  it('should serialize auth requests in enqueue order', async () => {
    const coordinator = createAuthSessionRequestCoordinator()
    const first = createDeferred<void>()
    const order: string[] = []

    const firstRequest = coordinator.enqueue(async () => {
      order.push('first:start')
      await first.promise
      order.push('first:end')
    })
    const secondRequest = coordinator.enqueue(async () => {
      order.push('second')
    })

    expect(order).toEqual([])
    await Promise.resolve()
    expect(order).toEqual(['first:start'])

    first.resolve()
    await Promise.all([firstRequest, secondRequest])
    expect(order).toEqual(['first:start', 'first:end', 'second'])
  })

  it('should share a refresh request within one session generation', async () => {
    const coordinator = createAuthSessionRequestCoordinator()
    const refresh = createDeferred<null>()
    let runs = 0
    const run = () =>
      coordinator.refresh(async () => {
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

  it('should prevent a queued auth operation from committing after the session advances', async () => {
    const coordinator = createAuthSessionRequestCoordinator()
    const operation = createDeferred<void>()
    let canCommitAfterSettlement = true

    const request = coordinator.enqueue(async ({ canCommit }) => {
      await operation.promise
      canCommitAfterSettlement = canCommit()
    })

    await Promise.resolve()
    coordinator.advanceSession()
    operation.resolve()
    await request

    expect(canCommitAfterSettlement).toBe(false)
  })

  it('should settle a logout once and prevent refresh from committing', async () => {
    const coordinator = createAuthSessionRequestCoordinator()
    const logout = createDeferred<void>()
    let clears = 0
    let logoutRequests = 0

    const first = coordinator.settleLogout({
      clearSession: () => {
        clears += 1
        coordinator.advanceSession()
      },
      request: async () => {
        logoutRequests += 1
        await logout.promise
      },
    })
    const second = coordinator.settleLogout({
      clearSession: () => {
        clears += 1
      },
      request: async () => {
        logoutRequests += 1
      },
    })

    expect(first).toBe(second)
    expect(await coordinator.refresh(async () => null)).toBeNull()
    logout.resolve()
    await first
    expect({ clears, logoutRequests }).toEqual({ clears: 1, logoutRequests: 1 })
  })

  it('should discard a deferred invalidation after the session advances', async () => {
    const coordinator = createAuthSessionRequestCoordinator()
    let invalidations = 0

    const first = coordinator.refresh(async ({ deferInvalidation }) => {
      deferInvalidation(() => {
        invalidations += 1
      })
      return null
    })
    const second = coordinator.enqueue(async () => {
      coordinator.advanceSession()
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
