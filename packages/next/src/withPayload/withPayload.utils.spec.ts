import { describe, expect, it } from 'vitest'

import {
  getUnsupportedNextVersionWarning,
  parseSemver,
  satisfiesNextRange,
} from './withPayload.utils.js'

describe('satisfiesNextRange', () => {
  it('returns true for a version inside a `>= <` range', () => {
    expect(satisfiesNextRange(parseSemver('16.2.6'), '>=16.2.6 <17.0.0')).toBe(true)
    expect(satisfiesNextRange(parseSemver('16.5.0'), '>=16.2.6 <17.0.0')).toBe(true)
  })

  it('returns false for a version below the lower bound', () => {
    expect(satisfiesNextRange(parseSemver('16.2.1'), '>=16.2.6 <17.0.0')).toBe(false)
    expect(satisfiesNextRange(parseSemver('16.0.0'), '>=16.2.6 <17.0.0')).toBe(false)
  })

  it('returns false for a version at or above the upper bound', () => {
    expect(satisfiesNextRange(parseSemver('17.0.0'), '>=16.2.6 <17.0.0')).toBe(false)
    expect(satisfiesNextRange(parseSemver('18.1.2'), '>=16.2.6 <17.0.0')).toBe(false)
  })

  it('supports disjoint ranges joined by ||', () => {
    const range = '>=15.2.9 <15.3.0 || >=15.3.9 <15.4.0 || >=15.4.11 <15.5.0 || >=16.2.6 <17.0.0'

    expect(satisfiesNextRange(parseSemver('15.4.11'), range)).toBe(true)
    expect(satisfiesNextRange(parseSemver('16.2.7'), range)).toBe(true)
    expect(satisfiesNextRange(parseSemver('15.4.0'), range)).toBe(false)
    expect(satisfiesNextRange(parseSemver('16.2.1'), range)).toBe(false)
  })

  it('compares prerelease (canary) versions by their core version', () => {
    expect(satisfiesNextRange(parseSemver('16.3.0-canary.1'), '>=16.2.6 <17.0.0')).toBe(true)
  })

  it('returns false when version or range is missing', () => {
    expect(satisfiesNextRange(parseSemver('not-a-version'), '>=16.2.6 <17.0.0')).toBe(false)
    expect(satisfiesNextRange(parseSemver('16.2.6'), '')).toBe(false)
  })
})

describe('getUnsupportedNextVersionWarning', () => {
  const range = '>=16.2.6 <17.0.0'

  it('returns undefined when the installed version is supported', () => {
    expect(getUnsupportedNextVersionWarning(parseSemver('16.3.0'), range)).toBeUndefined()
  })

  it('returns a warning mentioning the installed version and supported range', () => {
    const warning = getUnsupportedNextVersionWarning(parseSemver('16.2.1'), range)

    expect(warning).toContain('16.2.1')
    expect(warning).toContain(range)
  })

  it('returns undefined when the installed version cannot be determined', () => {
    expect(getUnsupportedNextVersionWarning(undefined, range)).toBeUndefined()
  })

  it('returns undefined when the supported range cannot be determined', () => {
    expect(getUnsupportedNextVersionWarning(parseSemver('16.2.1'), undefined)).toBeUndefined()
  })
})
