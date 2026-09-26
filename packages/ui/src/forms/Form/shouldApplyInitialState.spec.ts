import { describe, expect, it } from 'vitest'

import { shouldApplyInitialState } from './shouldApplyInitialState.js'

describe('shouldApplyInitialState', () => {
  it('applies the first initialState on mount', () => {
    expect(
      shouldApplyInitialState({
        alreadyApplied: false,
        documentChanged: false,
        hasInitialState: true,
        modified: false,
      }),
    ).toBe(true)
  })

  it('skips a later initialState while a dirty field still has a value', () => {
    expect(
      shouldApplyInitialState({
        alreadyApplied: true,
        documentChanged: false,
        hasInitialState: true,
        modified: true,
      }),
    ).toBe(false)
  })

  it('still applies when navigating to another document', () => {
    expect(
      shouldApplyInitialState({
        alreadyApplied: true,
        documentChanged: true,
        hasInitialState: true,
        modified: true,
      }),
    ).toBe(true)
  })

  it('applies after a pristine form-state refresh', () => {
    expect(
      shouldApplyInitialState({
        alreadyApplied: true,
        documentChanged: false,
        hasInitialState: true,
        modified: false,
      }),
    ).toBe(true)
  })
})
