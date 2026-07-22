export type SessionActivitySource =
  | 'input'
  | 'keydown'
  | 'pointerdown'
  | 'route'
  | 'visibility'
  | 'wheel'

export type MarkSessionActivity = (source: SessionActivitySource) => boolean

export const sessionActivityThrottleMs = 5_000

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
  document,
  markActivity,
  window,
}: {
  document: Document
  markActivity: MarkSessionActivity
  window: Window
}): () => void {
  const pointerdownListener = () => markActivity('pointerdown')
  const keydownListener = () => markActivity('keydown')
  const inputListener = () => markActivity('input')
  const wheelListener = () => markActivity('wheel')
  const visibilitychangeListener = () => {
    if (document.visibilityState === 'visible') {
      markActivity('visibility')
    }
  }
  const wheelListenerOptions = {
    capture: true,
    passive: true,
  }

  window.addEventListener('pointerdown', pointerdownListener, true)
  window.addEventListener('keydown', keydownListener, true)
  window.addEventListener('input', inputListener, true)
  window.addEventListener('wheel', wheelListener, wheelListenerOptions)
  document.addEventListener('visibilitychange', visibilitychangeListener, true)

  return () => {
    window.removeEventListener('pointerdown', pointerdownListener, true)
    window.removeEventListener('keydown', keydownListener, true)
    window.removeEventListener('input', inputListener, true)
    window.removeEventListener('wheel', wheelListener, wheelListenerOptions)
    document.removeEventListener('visibilitychange', visibilitychangeListener, true)
  }
}
