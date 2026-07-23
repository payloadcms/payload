export type CompileIndicatorState = {
  hideAt: null | number
  visible: boolean
  visibleSince: null | number
}

export function createInitialCompileIndicatorState(): CompileIndicatorState {
  return { hideAt: null, visible: false, visibleSince: null }
}

/**
 * Applies a compiling-status change to the timeline state. When compiling starts, the indicator
 * becomes visible immediately (and any pending hide is cancelled). When compiling stops, the
 * indicator stays visible until it has been shown for at least `minimumVisibleMs`, to avoid
 * flickering on fast rebuilds.
 */
export function applyIsCompilingChange({
  isCompiling,
  minimumVisibleMs,
  now,
  state,
}: {
  isCompiling: boolean
  minimumVisibleMs: number
  now: number
  state: CompileIndicatorState
}): CompileIndicatorState {
  if (isCompiling) {
    return { hideAt: null, visible: true, visibleSince: state.visibleSince ?? now }
  }

  if (!state.visible) {
    return state
  }

  const visibleSince = state.visibleSince ?? now
  const elapsed = now - visibleSince

  if (elapsed >= minimumVisibleMs) {
    return createInitialCompileIndicatorState()
  }

  return { hideAt: visibleSince + minimumVisibleMs, visible: true, visibleSince }
}

/**
 * Applies a scheduled hide-timeout tick. Only takes effect once `now` has reached the
 * previously computed `hideAt` — a timeout that fires early (e.g. because it was scheduled
 * before a later state update) is a no-op.
 */
export function applyHideTimeout({
  now,
  state,
}: {
  now: number
  state: CompileIndicatorState
}): CompileIndicatorState {
  if (state.hideAt === null || now < state.hideAt) {
    return state
  }

  return createInitialCompileIndicatorState()
}
