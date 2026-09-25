export type SessionActivitySource = 'focus' | 'keydown' | 'mousemove' | 'route'

export type MarkSessionActivity = (source: SessionActivitySource) => boolean

export type SessionActivityTracker = {
  record: MarkSessionActivity
  reset: () => void
}

export const sessionActivityThrottleMs = 5_000

/**
 * Coalesces browser and route activity into periodic session activity.
 *
 * The tracker reports whether the activity was accepted. Activity inside the throttle
 * interval is ignored and does not call `onActivity`.
 */
export function createSessionActivityTracker({
  now = Date.now,
  onActivity,
  throttleMs = sessionActivityThrottleMs,
}: {
  now?: () => number
  onActivity: (source: SessionActivitySource, occurredAt: number) => void
  throttleMs?: number
}): SessionActivityTracker {
  let lastActivityAt: number | undefined

  return {
    record: (source) => {
      const occurredAt = now()

      if (lastActivityAt !== undefined && occurredAt - lastActivityAt < throttleMs) {
        return false
      }

      lastActivityAt = occurredAt
      onActivity(source, occurredAt)

      return true
    },
    reset: () => {
      lastActivityAt = undefined
    },
  }
}

export function registerSessionActivityListeners({
  markActivity,
  window,
}: {
  markActivity: MarkSessionActivity
  window: Window
}): () => void {
  const focusListener = () => markActivity('focus')
  const keydownListener = () => markActivity('keydown')
  const mousemoveListener = () => markActivity('mousemove')
  const mousemoveListenerOptions = { capture: true, passive: true }

  window.addEventListener('focus', focusListener, true)
  window.addEventListener('keydown', keydownListener, true)
  window.addEventListener('mousemove', mousemoveListener, mousemoveListenerOptions)

  return () => {
    window.removeEventListener('focus', focusListener, true)
    window.removeEventListener('keydown', keydownListener, true)
    window.removeEventListener('mousemove', mousemoveListener, mousemoveListenerOptions)
  }
}
