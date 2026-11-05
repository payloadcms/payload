import type { AuthSession } from '../types.js'

export type ActivityStatus = 'closed' | 'tracking' | 'waiting' | 'will-refresh'

type GetActivityStatusArgs = {
  authSession: AuthSession
  nowMs: number
}

type GetActivityWindowStatusArgs = {
  activityStatus: ActivityStatus
  authSession: AuthSession
  nowMs: number
}

type GetRefreshWindowStatusArgs = {
  authSession: AuthSession
  nowMs: number
}

export const formatCountdown = (durationMs: number): string => {
  const totalSeconds = Math.max(0, Math.ceil(durationMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export const getActivityStatus = ({
  authSession,
  nowMs,
}: GetActivityStatusArgs): ActivityStatus => {
  if (nowMs >= authSession.reminderStartsAt) {
    return 'closed'
  }

  if (authSession.activityRecorded) {
    return 'will-refresh'
  }

  if (nowMs >= authSession.activityTrackingStartsAt) {
    return 'tracking'
  }

  return 'waiting'
}

export const getActivityWindowStatus = ({
  activityStatus,
  authSession,
  nowMs,
}: GetActivityWindowStatusArgs): string => {
  if (activityStatus === 'closed') {
    return 'Closed · no refresh'
  }

  if (activityStatus === 'will-refresh') {
    if (nowMs < authSession.refreshStartsAt) {
      return `Recorded · refresh in ${formatCountdown(authSession.refreshStartsAt - nowMs)}`
    }

    return 'Recorded · refreshing'
  }

  if (activityStatus === 'tracking') {
    return `Open · closes in ${formatCountdown(authSession.reminderStartsAt - nowMs)}`
  }

  return `Opens in ${formatCountdown(authSession.activityTrackingStartsAt - nowMs)}`
}

export const getRefreshWindowStatus = ({
  authSession,
  nowMs,
}: GetRefreshWindowStatusArgs): string => {
  if (nowMs >= authSession.reminderStartsAt) {
    return 'Closed'
  }

  if (nowMs >= authSession.refreshStartsAt) {
    return 'Open'
  }

  return `Opens in ${formatCountdown(authSession.refreshStartsAt - nowMs)}`
}
