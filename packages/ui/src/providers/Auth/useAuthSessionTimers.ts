'use client'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import type { SessionActivitySource } from './sessionActivity.js'
import type { AuthSessionTiming } from './sessionTiming.js'

import {
  createSessionActivityTracker,
  registerSessionActivityListeners,
} from './sessionActivity.js'
import { getAuthSessionTiming } from './sessionTiming.js'

const maxTimeoutMs = 2_147_483_647 // ~24.8 days

export type AuthSessionTimers = {
  clear: () => void
  getCurrentExpirationMs: () => number | undefined
  /** Records activity only while the activity tracking window is open. */
  recordActivity: (source: SessionActivitySource) => boolean
  scheduleRefresh: (forceRefresh?: boolean) => void
  setExpiration: (expirationMs: number) => AuthSessionTiming | undefined
}

export type UseAuthSessionTimersArgs = {
  isAuthenticated: boolean
  onActivity: () => void
  onActivityRefresh: () => void
  onExpire: (expirationMs: number) => void
  onReminder: () => void
}

/**
 * Manages activity-aware refresh, expiration reminders, and logout timing for the current session.
 *
 * Activity inside the refresh window schedules a refresh. Earlier activity is remembered until the
 * refresh-window checkpoint so the session can still be extended without requiring another
 * activity event.
 */
export function useAuthSessionTimers({
  isAuthenticated,
  onActivity,
  onActivityRefresh,
  onExpire,
  onReminder,
}: UseAuthSessionTimersArgs): AuthSessionTimers {
  const activityListenerCleanupRef = useRef<(() => void) | undefined>(undefined)
  const activityCheckpointTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const forceLogOutTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const hasActiveSessionRef = useRef(isAuthenticated)
  const lastSessionActivityAtRef = useRef<number>(undefined)
  const scheduledRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const reminderTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const sessionTimingRef = useRef<AuthSessionTiming>(undefined)
  const tokenExpirationMsRef = useRef<number>(undefined)
  const callbacksRef = useRef({ onActivity, onActivityRefresh, onExpire, onReminder })

  const scheduleRefresh = useCallback((forceRefresh?: boolean) => {
    if (!hasActiveSessionRef.current) {
      return
    }

    const sessionTiming = sessionTimingRef.current

    if (forceRefresh || (sessionTiming && Date.now() >= sessionTiming.refreshStartsAt)) {
      clearTimeout(scheduledRefreshTimeoutRef.current)
      scheduledRefreshTimeoutRef.current = setTimeout(() => {
        callbacksRef.current.onActivityRefresh()
      }, 1000)
    }
  }, [])

  const activityTracker = useMemo(
    () =>
      createSessionActivityTracker({
        onActivity: (_source, occurredAt) => {
          const isFirstActivity = lastSessionActivityAtRef.current === undefined

          lastSessionActivityAtRef.current = occurredAt

          if (isFirstActivity) {
            callbacksRef.current.onActivity()
          }

          scheduleRefresh()
        },
      }),
    [scheduleRefresh],
  )

  const recordActivity = useCallback(
    (source: SessionActivitySource): boolean => {
      const occurredAt = Date.now()
      const sessionTiming = sessionTimingRef.current
      const isActivityWindowOpen =
        sessionTiming &&
        occurredAt >= sessionTiming.activityTrackingStartsAt &&
        occurredAt < sessionTiming.reminderStartsAt

      if (!activityListenerCleanupRef.current || !isActivityWindowOpen) {
        return false
      }

      return activityTracker.record(source)
    },
    [activityTracker],
  )

  const addActivityListeners = useCallback(() => {
    if (activityListenerCleanupRef.current) {
      return
    }

    activityListenerCleanupRef.current = registerSessionActivityListeners({
      markActivity: recordActivity,
      window,
    })
  }, [recordActivity])

  const removeActivityListeners = useCallback(() => {
    const cleanup = activityListenerCleanupRef.current

    if (!cleanup) {
      return
    }

    activityListenerCleanupRef.current = undefined
    cleanup()
  }, [])

  const resetSessionLifecycle = useCallback(() => {
    clearTimeout(activityCheckpointTimeoutRef.current)
    clearTimeout(forceLogOutTimeoutRef.current)
    clearTimeout(reminderTimeoutRef.current)
    clearTimeout(scheduledRefreshTimeoutRef.current)
    removeActivityListeners()
    activityTracker.reset()
    lastSessionActivityAtRef.current = undefined
  }, [activityTracker, removeActivityListeners])

  const clear = useCallback(() => {
    resetSessionLifecycle()
    hasActiveSessionRef.current = false
    sessionTimingRef.current = undefined
    tokenExpirationMsRef.current = undefined
  }, [resetSessionLifecycle])

  const setExpiration = useCallback(
    (expirationMs: number) => {
      if (!Number.isFinite(expirationMs)) {
        return
      }

      resetSessionLifecycle()
      tokenExpirationMsRef.current = expirationMs

      const sessionTiming = getAuthSessionTiming({ expirationMs })

      sessionTimingRef.current = sessionTiming

      const scheduleReminder = () => {
        if (tokenExpirationMsRef.current !== expirationMs) {
          return
        }

        const reminderStartsInMs = Math.max(sessionTiming.reminderStartsAt - Date.now(), 0)

        reminderTimeoutRef.current = setTimeout(
          () => {
            if (tokenExpirationMsRef.current !== expirationMs) {
              return
            }

            if (Date.now() < sessionTiming.reminderStartsAt) {
              scheduleReminder()
              return
            }

            clearTimeout(scheduledRefreshTimeoutRef.current)
            removeActivityListeners()

            if (Date.now() < sessionTiming.expiresAt) {
              callbacksRef.current.onReminder()
            }
          },
          Math.min(reminderStartsInMs, maxTimeoutMs),
        )
      }

      const scheduleActivityCheckpoint = () => {
        if (tokenExpirationMsRef.current !== expirationMs) {
          return
        }

        const refreshStartsInMs = Math.max(sessionTiming.refreshStartsAt - Date.now(), 0)

        activityCheckpointTimeoutRef.current = setTimeout(
          () => {
            if (tokenExpirationMsRef.current !== expirationMs) {
              return
            }

            const checkpointAt = Date.now()

            if (checkpointAt < sessionTiming.refreshStartsAt) {
              scheduleActivityCheckpoint()
              return
            }

            const lastActivityAt = lastSessionActivityAtRef.current
            const hasRecentActivity =
              lastActivityAt !== undefined &&
              checkpointAt < sessionTiming.reminderStartsAt &&
              lastActivityAt >= sessionTiming.activityTrackingStartsAt

            if (hasRecentActivity) {
              scheduleRefresh(true)
            }
          },
          Math.min(refreshStartsInMs, maxTimeoutMs),
        )
      }

      const scheduleExpiration = () => {
        if (tokenExpirationMsRef.current !== expirationMs) {
          return
        }

        const expiresInMs = Math.max(sessionTiming.expiresAt - Date.now(), 0)

        forceLogOutTimeoutRef.current = setTimeout(
          () => {
            if (tokenExpirationMsRef.current === expirationMs) {
              if (Date.now() < sessionTiming.expiresAt) {
                scheduleExpiration()
                return
              }

              hasActiveSessionRef.current = false
              removeActivityListeners()
              callbacksRef.current.onExpire(expirationMs)
            }
          },
          Math.min(expiresInMs, maxTimeoutMs),
        )
      }

      hasActiveSessionRef.current = expirationMs > Date.now()

      if (hasActiveSessionRef.current) {
        addActivityListeners()
        scheduleReminder()
        scheduleActivityCheckpoint()
      }

      scheduleExpiration()

      return sessionTiming
    },
    [addActivityListeners, removeActivityListeners, resetSessionLifecycle, scheduleRefresh],
  )

  const getCurrentExpirationMs = useCallback(() => tokenExpirationMsRef.current, [])

  useEffect(() => {
    callbacksRef.current = { onActivity, onActivityRefresh, onExpire, onReminder }
  }, [onActivity, onActivityRefresh, onExpire, onReminder])

  useEffect(() => {
    hasActiveSessionRef.current = isAuthenticated

    if (!isAuthenticated) {
      removeActivityListeners()
    }
  }, [isAuthenticated, removeActivityListeners])

  useEffect(() => {
    return clear
  }, [clear])

  return useMemo(
    () => ({
      clear,
      getCurrentExpirationMs,
      recordActivity,
      scheduleRefresh,
      setExpiration,
    }),
    [clear, getCurrentExpirationMs, recordActivity, scheduleRefresh, setExpiration],
  )
}
