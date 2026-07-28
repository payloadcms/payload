import { describe, expect, it } from 'vitest'

import {
  applyHideTimeout,
  applyIsCompilingChange,
  createInitialCompileIndicatorState,
} from './timeline.js'

describe('DevCompilingIndicator timeline', () => {
  it('should become visible immediately when compiling starts', () => {
    const state = createInitialCompileIndicatorState()

    const next = applyIsCompilingChange({
      isCompiling: true,
      minimumVisibleMs: 1000,
      now: 1000,
      state,
    })

    expect(next.visible).toBe(true)
    expect(next.hideAt).toBeNull()
  })

  it('should stay visible until the minimum has elapsed when compiling stops early', () => {
    let state = createInitialCompileIndicatorState()
    state = applyIsCompilingChange({ isCompiling: true, minimumVisibleMs: 1000, now: 1000, state })
    state = applyIsCompilingChange({
      isCompiling: false,
      minimumVisibleMs: 1000,
      now: 1200,
      state,
    })

    expect(state.visible).toBe(true)
    expect(state.hideAt).toBe(2000)

    const beforeHide = applyHideTimeout({ now: 1999, state })
    expect(beforeHide.visible).toBe(true)

    const afterHide = applyHideTimeout({ now: 2000, state })
    expect(afterHide.visible).toBe(false)
    expect(afterHide.hideAt).toBeNull()
  })

  it('should hide immediately when compiling stops after the minimum has already elapsed', () => {
    let state = createInitialCompileIndicatorState()
    state = applyIsCompilingChange({ isCompiling: true, minimumVisibleMs: 1000, now: 1000, state })
    state = applyIsCompilingChange({
      isCompiling: false,
      minimumVisibleMs: 1000,
      now: 2500,
      state,
    })

    expect(state.visible).toBe(false)
    expect(state.hideAt).toBeNull()
  })

  it('should cancel a pending hide when compiling starts again', () => {
    let state = createInitialCompileIndicatorState()
    state = applyIsCompilingChange({ isCompiling: true, minimumVisibleMs: 1000, now: 1000, state })
    state = applyIsCompilingChange({
      isCompiling: false,
      minimumVisibleMs: 1000,
      now: 1200,
      state,
    })
    expect(state.hideAt).not.toBeNull()

    state = applyIsCompilingChange({ isCompiling: true, minimumVisibleMs: 1000, now: 1300, state })

    expect(state.visible).toBe(true)
    expect(state.hideAt).toBeNull()
  })

  it('should no-op when compiling stops while already hidden', () => {
    const state = createInitialCompileIndicatorState()

    const next = applyIsCompilingChange({
      isCompiling: false,
      minimumVisibleMs: 1000,
      now: 1000,
      state,
    })

    expect(next).toEqual(state)
  })

  it('should no-op a hide timeout that fires before hideAt is reached', () => {
    let state = createInitialCompileIndicatorState()
    state = applyIsCompilingChange({ isCompiling: true, minimumVisibleMs: 1000, now: 1000, state })

    const next = applyHideTimeout({ now: 1500, state })

    expect(next).toEqual(state)
  })
})
