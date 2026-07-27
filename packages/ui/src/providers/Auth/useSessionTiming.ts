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
  const hasActiveSessionRef = useRef(isAuthenticated)
  const knownExpirationMsRef = useRef<number>(undefined)
  const lastSessionActivityAtRef = useRef<number>(undefined)
  const refreshTokenTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const reminderTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null)
  const tokenExpirationMsRef = useRef<number>(undefined)
  const callbacksRef = useRef({ onActivityRefresh, onExpire, onReminder })

  useEffect(() => {
    callbacksRef.current = { onActivityRefresh, onExpire, onReminder }
  }, [onActivityRefresh, onExpire, onReminder])

  const refreshCookie = useCallback((forceRefresh?: boolean) => {
    if (!hasActiveSessionRef.current) {
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

  const installActivityListeners = useCallback(() => {
    if (activityListenerCleanupRef.current) {
      return
    }

    activityListenerCleanupRef.current = registerSessionActivityListeners({ markActivity, window })
  }, [markActivity])

  const removeActivityListeners = useCallback(() => {
    const cleanup = activityListenerCleanupRef.current

    if (!cleanup) {
      return
    }

    activityListenerCleanupRef.current = undefined
    cleanup()
  }, [])

  const clear = useCallback(() => {
    hasActiveSessionRef.current = false
    clearTimeout(refreshTokenTimeoutRef.current)
    clearTimeout(reminderTimeoutRef.current)
    clearTimeout(forceLogOutTimeoutRef.current)
    clearTimeout(activityCheckpointTimeoutRef.current)
    removeActivityListeners()
    lastSessionActivityAtRef.current = undefined
    tokenExpirationMsRef.current = undefined
  }, [removeActivityListeners])

  const applyExpiration = useCallback(
    (expirationMs: number) => {
      if (!Number.isFinite(expirationMs)) {
        return
      }

      clearTimeout(reminderTimeoutRef.current)
      clearTimeout(forceLogOutTimeoutRef.current)
      clearTimeout(activityCheckpointTimeoutRef.current)
      clearTimeout(refreshTokenTimeoutRef.current)
      lastSessionActivityAtRef.current = undefined
      knownExpirationMsRef.current = Math.max(knownExpirationMsRef.current ?? 0, expirationMs)
      tokenExpirationMsRef.current = expirationMs

      const expiresInMs = Math.max(0, Math.min(expirationMs - Date.now(), maxTimeoutMs))

      if (!expiresInMs) {
        hasActiveSessionRef.current = false
        removeActivityListeners()
        forceLogOutTimeoutRef.current = setTimeout(() => {
          if (tokenExpirationMsRef.current === expirationMs) {
            callbacksRef.current.onExpire(expirationMs)
          }
        }, 0)
        return
      }

      hasActiveSessionRef.current = true
      installActivityListeners()

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
    [installActivityListeners, refreshCookie, removeActivityListeners],
  )

  const getCurrentExpirationMs = useCallback(() => tokenExpirationMsRef.current, [])
  const getKnownExpirationMs = useCallback(() => knownExpirationMsRef.current, [])

  useEffect(() => {
    hasActiveSessionRef.current = isAuthenticated

    if (isAuthenticated) {
      installActivityListeners()
      return
    }

    removeActivityListeners()
  }, [installActivityListeners, isAuthenticated, removeActivityListeners])

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
