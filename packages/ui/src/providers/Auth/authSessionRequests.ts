import type { AuthenticatedUser } from 'payload'

export type AuthRequestContext = {
  acceptResult: () => boolean
  invalidateWhenIdle: (invalidate: () => void) => void
  isCurrent: () => boolean
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
      const isCurrent = () => sessionGeneration === requestGeneration && !isLoggingOut
      const result = await request({
        acceptResult: () => {
          if (!isCurrent()) {
            return false
          }

          clearPendingInvalidation()
          return true
        },
        invalidateWhenIdle: (invalidate) => {
          if (!isCurrent()) {
            return
          }

          if (requestSequence < authRequestSequence) {
            pendingAuthInvalidation = { generation: requestGeneration, run: invalidate }
          } else {
            invalidate()
          }
        },
        isCurrent,
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
    void pendingLogout.then(
      () => {
        if (logoutRequest === pendingLogout) {
          logoutRequest = undefined
        }
      },
      () => {
        if (logoutRequest === pendingLogout) {
          logoutRequest = undefined
        }
      },
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
