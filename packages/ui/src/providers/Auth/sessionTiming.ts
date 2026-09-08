import type { AuthSession } from './types.js'

export type AuthSessionTiming = Omit<AuthSession, 'activityRecorded'>

export type GetAuthSessionTimingArgs = {
  expirationMs: number
  nowMs?: number
}

/**
 * Returns the fixed lifecycle boundaries for a token expiration.
 */
export function getAuthSessionTiming({
  expirationMs,
  nowMs = Date.now(),
}: GetAuthSessionTimingArgs): AuthSessionTiming {
  const expiresInMs = Math.max(0, expirationMs - nowMs)
  const reminderWindowMs = Math.min(60_000, expiresInMs / 2)
  const refreshWindowMs = reminderWindowMs * 2
  const activityTrackingWindowMs = refreshWindowMs * 2

  return Object.freeze({
    activityTrackingStartsAt: Math.max(expirationMs - activityTrackingWindowMs, nowMs),
    expiresAt: expirationMs,
    refreshStartsAt: Math.max(expirationMs - refreshWindowMs, nowMs),
    reminderStartsAt: Math.max(expirationMs - reminderWindowMs, nowMs),
  })
}
