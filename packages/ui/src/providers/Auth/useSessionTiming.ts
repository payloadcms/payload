'use client'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import {
  createSessionActivityTracker,
  registerSessionActivityListeners,
} from './sessionActivity.js'

const maxTimeoutMs = 2147483647

export type SessionTimingController = {
  applyExpiration: (expirationMs: number) => void
  clear: () => void
  getCurrentExpirationMs: () => number | undefined
  getKnownExpirationMs: () => number | undefined
  refreshCookie: (forceRefresh?: boolean) => void
}

export function useSessionTiming({
  isAuthenticated,
  onActivityRefresh,
  onExpire,
  onReminder,
}: {
  isAuthenticated: boolean
  onActivityRefresh: () => void
  onExpire: (expirationMs: number) => void
  onReminder: () => void
}): SessionTimingController {
  const activityListenerCleanupRef = useRef<(() => void) | undefined>(undefined)
  const activityCheckpointTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const forceLogoutBufferMsRef = useRef(120_000)
  const forceLogOutTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const isAuthenticatedRef = useRef(isAuthenticated)
  const knownExpirationMsRef = useRef<number>(undefined)
  const lastSessionActivityAtRef = useRef<number>(undefined)
  const refreshTokenTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const reminderTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const tokenExpirationMsRef = useRef<number>(undefined)
  const callbacksRef = useRef({ onActivityRefresh, onExpire, onReminder })

  isAuthenticatedRef.current = isAuthenticated

  useEffect(() => {
    callbacksRef.current = { onActivityRefresh, onExpire, onReminder }
  }, [onActivityRefresh, onExpire, onReminder])

  const clear = useCallback(() => {
    clearTimeout(refreshTokenTimeoutRef.current)
    clearTimeout(reminderTimeoutRef.current)
    clearTimeout(forceLogOutTimeoutRef.current)
    clearTimeout(activityCheckpointTimeoutRef.current)
    activityListenerCleanupRef.current?.()
    activityListenerCleanupRef.current = undefined
    lastSessionActivityAtRef.current = undefined
    tokenExpirationMsRef.current = undefined
  }, [])

  const refreshCookie = useCallback((forceRefresh?: boolean) => {
    if (!isAuthenticatedRef.current) {
      return
    }

    const expiresInMs = Math.max(0, (tokenExpirationMsRef.current ?? 0) - Date.now())

    if (
      forceRefresh ||
      (tokenExpirationMsRef.current && expiresInMs <= forceLogoutBufferMsRef.current * 2)
    ) {
      clearTimeout(refreshTokenTimeoutRef.current)
      refreshTokenTimeoutRef.current = setTimeout(() => {
        callbacksRef.current.onActivityRefresh()
      }, 1000)
    }
  }, [])

  const markActivity = useMemo(
    () =>
      createSessionActivityTracker({
        onActivity: (_source, occurredAt) => {
          lastSessionActivityAtRef.current = occurredAt
          refreshCookie()
        },
      }),
    [],
  )

  const applyExpiration = useCallback(
    (expirationMs: number) => {
      clearTimeout(reminderTimeoutRef.current)
      clearTimeout(forceLogOutTimeoutRef.current)
      clearTimeout(activityCheckpointTimeoutRef.current)
      clearTimeout(refreshTokenTimeoutRef.current)
      lastSessionActivityAtRef.current = undefined
      knownExpirationMsRef.current = Math.max(knownExpirationMsRef.current ?? 0, expirationMs)
      tokenExpirationMsRef.current = expirationMs

      const expiresInMs = Math.max(0, Math.min(expirationMs - Date.now(), maxTimeoutMs))

      if (!expiresInMs) {
        return
      }

      const forceLogoutBufferMs = Math.min(60_000, expiresInMs / 2)
      const refreshWindowMs = forceLogoutBufferMs * 2

      forceLogoutBufferMsRef.current = forceLogoutBufferMs
      reminderTimeoutRef.current = setTimeout(
        () => {
          callbacksRef.current.onReminder()
        },
        Math.max(expiresInMs - forceLogoutBufferMs, 0),
      )
      activityCheckpointTimeoutRef.current = setTimeout(
        () => {
          const checkpointAt = Date.now()
          const lastActivityAt = lastSessionActivityAtRef.current
          const hasRecentActivity =
            lastActivityAt !== undefined &&
            lastActivityAt <= checkpointAt &&
            checkpointAt - lastActivityAt <= refreshWindowMs

          if (hasRecentActivity) {
            refreshCookie(true)
          }
        },
        Math.max(expiresInMs - refreshWindowMs, 0),
      )
      forceLogOutTimeoutRef.current = setTimeout(() => {
        if (tokenExpirationMsRef.current === expirationMs) {
          callbacksRef.current.onExpire(expirationMs)
        }
      }, expiresInMs)
    },
    [refreshCookie],
  )

  const getCurrentExpirationMs = useCallback(() => tokenExpirationMsRef.current, [])
  const getKnownExpirationMs = useCallback(() => knownExpirationMsRef.current, [])

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const cleanup = registerSessionActivityListeners({ markActivity, window })

    activityListenerCleanupRef.current = cleanup

    return () => {
      cleanup()

      if (activityListenerCleanupRef.current === cleanup) {
        activityListenerCleanupRef.current = undefined
      }
    }
  }, [isAuthenticated, markActivity])

  useEffect(() => clear, [clear])

  return useMemo(
    () => ({
      applyExpiration,
      clear,
      getCurrentExpirationMs,
      getKnownExpirationMs,
      refreshCookie,
    }),
    [applyExpiration, clear, getCurrentExpirationMs, getKnownExpirationMs, refreshCookie],
  )
}
