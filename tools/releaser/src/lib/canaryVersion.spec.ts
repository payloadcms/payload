import semver from 'semver'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getCanaryVersion } from './canaryVersion.js'

describe('getCanaryVersion', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it.each([
    { monorepoVersion: '4.0.0-beta.8', expected: '4.0.0-canary.20261112' },
    { monorepoVersion: '4.0.0', expected: '4.0.0-canary.20261112' },
    { monorepoVersion: '3.93.0', expected: '3.93.0-canary.20261112' },
  ])('should base $monorepoVersion on $expected', ({ monorepoVersion, expected }) => {
    expect(getCanaryVersion({ date: new Date('2026-11-12T07:00:00Z'), monorepoVersion })).toBe(
      expected,
    )
  })

  it('should use the UTC date, not the local date', () => {
    // Pinned west of UTC: on a UTC runner, local and UTC dates agree and the test proves nothing.
    vi.stubEnv('TZ', 'America/Los_Angeles')

    expect(
      getCanaryVersion({
        date: new Date('2026-11-12T23:30:00-08:00'),
        monorepoVersion: '4.0.0-beta.8',
      }),
    ).toBe('4.0.0-canary.20261113')
  })

  it('should zero-pad month and day', () => {
    expect(
      getCanaryVersion({ date: new Date('2027-01-05T07:00:00Z'), monorepoVersion: '4.0.0-beta.8' }),
    ).toBe('4.0.0-canary.20270105')
  })

  it('should sort above the last counter-style canary', () => {
    const next = getCanaryVersion({
      date: new Date('2026-11-12T07:00:00Z'),
      monorepoVersion: '4.0.0-beta.8',
    })

    expect(semver.gt(next, '4.0.0-canary.39')).toBe(true)
  })

  it('should throw on an invalid monorepo version', () => {
    expect(() =>
      getCanaryVersion({ date: new Date('2026-11-12T07:00:00Z'), monorepoVersion: 'nope' }),
    ).toThrow('nope')
  })
})
