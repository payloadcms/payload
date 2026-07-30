import { describe, expect, it } from 'vitest'

import { legacyTruncate } from './legacyTruncate.js'

describe('legacyTruncate', () => {
  it('should return body+suffix as-is when within maxLength', () => {
    const tracker = new Set<string>()
    expect(
      legacyTruncate({
        body: 'posts_title',
        suffix: '_idx',
        tracker,
      }),
    ).toBe('posts_title_idx')
  })

  it('should truncate to 60 chars when name exceeds 63 (historical behavior)', () => {
    const tracker = new Set<string>()
    const result = legacyTruncate({
      body: 'a'.repeat(80),
      suffix: '_idx',
      tracker,
    })
    expect(result.length).toBeLessThanOrEqual(60)
    expect(result.endsWith('_idx')).toBe(true)
  })

  it('should splice _<n> between body and suffix on collision (matches buildIndexName)', () => {
    const tracker = new Set<string>()
    const args = {
      body: 'posts_title',
      suffix: '_idx',
      tracker,
    }
    expect(legacyTruncate(args)).toBe('posts_title_idx')
    expect(legacyTruncate(args)).toBe('posts_title_1_idx')
  })

  it('should register the result in the tracker', () => {
    const tracker = new Set<string>()
    legacyTruncate({
      body: 'users_email',
      suffix: '_idx',
      tracker,
    })
    expect(tracker.has('users_email_idx')).toBe(true)
  })

  it('should disambiguate after truncation (long body + collision)', () => {
    const tracker = new Set<string>()
    const args = {
      body: 'a'.repeat(80),
      suffix: '_idx',
      tracker,
    }
    const first = legacyTruncate(args)
    const second = legacyTruncate(args)
    expect(first).not.toBe(second)
    expect(second.length).toBeLessThanOrEqual(60)
    expect(second.endsWith('_idx')).toBe(true)
    expect(second).toMatch(/_1_idx$/)
  })
})
