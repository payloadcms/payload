export type SessionActivitySource = 'focus' | 'mousemove'

export type MarkSessionActivity = (source: SessionActivitySource) => boolean

export const sessionActivityThrottleMs = 5_000

/**
 * Coalesces focus and mouse movement into periodic session activity.
 *
 * The returned function reports whether the activity was accepted. Activity inside the throttle
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
}): MarkSessionActivity {
  let lastActivityAt: number | undefined

  return (source) => {
    const occurredAt = now()

    if (lastActivityAt !== undefined && occurredAt - lastActivityAt < throttleMs) {
      return false
    }

    lastActivityAt = occurredAt
    onActivity(source, occurredAt)

    return true
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
  const mousemoveListener = () => markActivity('mousemove')
  const mousemoveListenerOptions = { capture: true, passive: true }

  window.addEventListener('focus', focusListener, true)
  window.addEventListener('mousemove', mousemoveListener, mousemoveListenerOptions)

  return () => {
    window.removeEventListener('focus', focusListener, true)
    window.removeEventListener('mousemove', mousemoveListener, mousemoveListenerOptions)
  }
}
