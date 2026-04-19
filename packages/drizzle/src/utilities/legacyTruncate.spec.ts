import { describe, expect, it } from 'vitest'

import { legacyTruncate } from './legacyTruncate.js'

describe('legacyTruncate', () => {
  it('returns body+suffix as-is when within maxLength', () => {
    const tracker = new Map<string, 'index'>()
    expect(
      legacyTruncate({
        body: 'posts_title',
        maxLength: 63,
        suffix: '_idx',
        tracker,
        type: 'index',
      }),
    ).toBe('posts_title_idx')
  })

  it('truncates to 60 chars when name exceeds 63 (historical behavior)', () => {
    const tracker = new Map<string, 'index'>()
    const result = legacyTruncate({
      body: 'a'.repeat(80),
      maxLength: 63,
      suffix: '_idx',
      tracker,
      type: 'index',
    })
    expect(result.length).toBeLessThanOrEqual(60)
    expect(result.endsWith('_idx')).toBe(true)
  })

  it('splices _<n> between body and suffix on collision (matches buildIndexName)', () => {
    const tracker = new Map<string, 'index'>()
    const args = {
      body: 'posts_title',
      maxLength: 63,
      suffix: '_idx',
      tracker,
      type: 'index' as const,
    }
    expect(legacyTruncate(args)).toBe('posts_title_idx')
    expect(legacyTruncate(args)).toBe('posts_title_1_idx')
  })

  it('registers the result in the tracker', () => {
    const tracker = new Map<string, 'index'>()
    legacyTruncate({
      body: 'users_email',
      maxLength: 63,
      suffix: '_idx',
      tracker,
      type: 'index',
    })
    expect(tracker.get('users_email_idx')).toBe('index')
  })

  it('disambiguates after truncation (long body + collision)', () => {
    const tracker = new Map<string, 'index'>()
    const args = {
      body: 'a'.repeat(80),
      maxLength: 63,
      suffix: '_idx',
      tracker,
      type: 'index' as const,
    }
    const first = legacyTruncate(args)
    const second = legacyTruncate(args)
    expect(first).not.toBe(second)
    expect(second.length).toBeLessThanOrEqual(60)
    expect(second.endsWith('_idx')).toBe(true)
    expect(second).toMatch(/_1_idx$/)
  })

  it('respects maxLength < 60', () => {
    const tracker = new Map<string, 'index'>()
    const result = legacyTruncate({
      body: 'a'.repeat(80),
      maxLength: 40,
      suffix: '_idx',
      tracker,
      type: 'index',
    })
    expect(result.length).toBeLessThanOrEqual(40)
    expect(result.endsWith('_idx')).toBe(true)
  })

  it('disambiguates by bumping _<n> on cross-type collision (matches buildIndexName behavior)', () => {
    const tracker = new Map<string, 'index' | 'table'>()
    legacyTruncate({ body: 'abc', maxLength: 63, tracker, type: 'table' })
    const result = legacyTruncate({
      body: 'abc',
      maxLength: 63,
      tracker: tracker as any,
      type: 'index',
    })
    expect(result).toBe('abc_1')
    expect(tracker.get('abc_1')).toBe('index')
  })
})
