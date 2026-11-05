import type { AuthenticatedUser } from 'payload'

export type AuthRequestContext = {
  /** Accepts the result when its session is still active and cancels any deferred invalidation. */
  acceptResult: () => boolean
  /** Invalidates the session after newer queued auth requests have had a chance to restore it. */
  invalidateWhenIdle: (invalidate: () => void) => void
  /** Whether the session changed or logout began after this request was queued. */
  isResultStale: () => boolean
}

export type AuthSessionRequests = {
  discardPendingResults: () => void
  isLoggingOut: () => boolean
  logOut: ({
    clearSession,
    request,
  }: {
    clearSession: () => void
    request: () => Promise<void>
  }) => Promise<void>
  queue: <Result>(request: (context: AuthRequestContext) => Promise<Result>) => Promise<Result>
  refresh: (
    request: (context: AuthRequestContext) => Promise<AuthenticatedUser | null>,
  ) => Promise<AuthenticatedUser | null>
}

/**
 * Coordinates requests that read or update the current auth session.
 *
 * Requests run in order, concurrent refreshes and logouts share a promise, and outdated results can
 * be discarded after the session changes.
 */
export function createAuthSessionRequests(): AuthSessionRequests {
  let authRequestQueue = Promise.resolve()
  let authRequestSequence = 0
  let isLoggingOut = false
  let logoutRequest: Promise<void> | undefined
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

  const clearPendingInvalidation = (): void => {
    pendingAuthInvalidation = undefined
  }

  const discardPendingResults = (): void => {
    sessionGeneration += 1
    clearPendingInvalidation()
  }

  const queue = <Result>(
    request: (context: AuthRequestContext) => Promise<Result>,
  ): Promise<Result> => {
    const requestGeneration = sessionGeneration
    const requestSequence = ++authRequestSequence
    const runRequest = async (): Promise<Result> => {
      const isResultStale = () => sessionGeneration !== requestGeneration || isLoggingOut
      const result = await request({
        acceptResult: () => {
          if (isResultStale()) {
            return false
          }

          clearPendingInvalidation()
          return true
        },
        invalidateWhenIdle: (invalidate) => {
          if (isResultStale()) {
            return
          }

          if (requestSequence < authRequestSequence) {
            pendingAuthInvalidation = { generation: requestGeneration, run: invalidate }
          } else {
            invalidate()
          }
        },
        isResultStale,
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

    if (isLoggingOut) {
      return Promise.resolve(null)
    }

    if (activeRequest?.generation === requestGeneration) {
      return activeRequest.promise
    }

    const refreshPromise = queue(request)

    refreshRequest = { generation: requestGeneration, promise: refreshPromise }
    /** Stops sharing this refresh after it settles without clearing a newer refresh request. */
    const clearRefreshRequest = () => {
      if (refreshRequest?.promise === refreshPromise) {
        refreshRequest = undefined
      }
    }

    void refreshPromise.then(clearRefreshRequest, clearRefreshRequest)

    return refreshPromise
  }

  const logOut = ({
    clearSession,
    request,
  }: {
    clearSession: () => void
    request: () => Promise<void>
  }): Promise<void> => {
    if (logoutRequest !== undefined) {
      return logoutRequest
    }

    isLoggingOut = true
    clearSession()

    const pendingLogout = queue(async () => {
      try {
        await request()
      } finally {
        isLoggingOut = false
      }
    })

    logoutRequest = pendingLogout
    /** Stops sharing this logout after it settles without clearing a newer logout request. */
    const clearLogoutRequest = () => {
      if (logoutRequest === pendingLogout) {
        logoutRequest = undefined
      }
    }

    void pendingLogout.then(
      clearLogoutRequest, // onSuccess
      clearLogoutRequest, // onFailure
    )

    return pendingLogout
  }

  return {
    discardPendingResults,
    isLoggingOut: () => isLoggingOut,
    logOut,
    queue,
    refresh,
  }
}
