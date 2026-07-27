import type { AuthenticatedUser } from 'payload'

export type AuthRequestContext = {
  canCommit: () => boolean
  deferInvalidation: (invalidate: () => void) => void
  hasQueuedRequest: () => boolean
}

export type AuthSessionRequestCoordinator = {
  advanceSession: () => void
  clearPendingInvalidation: () => void
  enqueue: <Result>(
    request: (context: Pick<AuthRequestContext, 'hasQueuedRequest'>) => Promise<Result>,
  ) => Promise<Result>
  isLogoutPending: () => boolean
  refresh: (
    request: (context: AuthRequestContext) => Promise<AuthenticatedUser | null>,
  ) => Promise<AuthenticatedUser | null>
  settleLogout: ({
    clearSession,
    request,
  }: {
    clearSession: () => void
    request: () => Promise<void>
  }) => Promise<void>
}

export function createAuthSessionRequestCoordinator(): AuthSessionRequestCoordinator {
  let authRequestQueue = Promise.resolve()
  let authRequestSequence = 0
  let explicitLogoutSettlement: Promise<void> | undefined
  let isExplicitLogoutPending = false
  let pendingAuthInvalidation:
    | {
        generation: number
        run: () => void
      }
    | undefined
  let refreshRequest:
    | {
        generation: number
        promise: Promise<AuthenticatedUser | null>
      }
    | undefined
  let sessionGeneration = 0

  const clearPendingInvalidation = () => {
    pendingAuthInvalidation = undefined
  }

  const advanceSession = () => {
    sessionGeneration += 1
    clearPendingInvalidation()
  }

  const enqueue = <Result>(
    request: ({
      hasQueuedRequest,
    }: Pick<AuthRequestContext, 'hasQueuedRequest'>) => Promise<Result>,
  ): Promise<Result> => {
    const requestSequence = ++authRequestSequence
    const runRequest = async (): Promise<Result> => {
      const result = await request({
        hasQueuedRequest: () => requestSequence < authRequestSequence,
      })

      if (requestSequence === authRequestSequence) {
        const pendingInvalidation = pendingAuthInvalidation

        clearPendingInvalidation()

        if (pendingInvalidation?.generation === sessionGeneration) {
          pendingInvalidation.run()
        }
      }

      return result
    }
    const queuedRequest = authRequestQueue.then(runRequest, runRequest)

    authRequestQueue = queuedRequest.then(
      () => undefined,
      () => undefined,
    )

    return queuedRequest
  }

  const refresh = (
    request: (context: AuthRequestContext) => Promise<AuthenticatedUser | null>,
  ): Promise<AuthenticatedUser | null> => {
    const requestGeneration = sessionGeneration
    const activeRequest = refreshRequest

    if (isExplicitLogoutPending) {
      return Promise.resolve(null)
    }

    if (activeRequest?.generation === requestGeneration) {
      return activeRequest.promise
    }

    const refreshPromise = enqueue((context) =>
      request({
        canCommit: () => sessionGeneration === requestGeneration && !isExplicitLogoutPending,
        deferInvalidation: (invalidate) => {
          pendingAuthInvalidation = { generation: requestGeneration, run: invalidate }
        },
        hasQueuedRequest: context.hasQueuedRequest,
      }),
    )

    refreshRequest = { generation: requestGeneration, promise: refreshPromise }
    void refreshPromise.then(
      () => {
        if (refreshRequest?.promise === refreshPromise) {
          refreshRequest = undefined
        }
      },
      () => {
        if (refreshRequest?.promise === refreshPromise) {
          refreshRequest = undefined
        }
      },
    )

    return refreshPromise
  }

  const settleLogout = ({
    clearSession,
    request,
  }: {
    clearSession: () => void
    request: () => Promise<void>
  }): Promise<void> => {
    if (explicitLogoutSettlement !== undefined) {
      return explicitLogoutSettlement
    }

    isExplicitLogoutPending = true
    clearSession()

    const settlement = enqueue(async () => {
      try {
        await request()
      } finally {
        isExplicitLogoutPending = false
      }
    })

    explicitLogoutSettlement = settlement
    void settlement.then(
      () => {
        if (explicitLogoutSettlement === settlement) {
          explicitLogoutSettlement = undefined
        }
      },
      () => {
        if (explicitLogoutSettlement === settlement) {
          explicitLogoutSettlement = undefined
        }
      },
    )

    return settlement
  }

  return {
    advanceSession,
    clearPendingInvalidation,
    enqueue,
    isLogoutPending: () => isExplicitLogoutPending,
    refresh,
    settleLogout,
  }
}
