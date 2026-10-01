import { describe, expect, it, vi } from 'vitest'

import { findChangelogBaseTag, lineFromVersion } from './findChangelogBaseTag.js'

describe('lineFromVersion', () => {
  it('should classify beta, canary, and stable without throwing', () => {
    expect(lineFromVersion('4.0.0-beta.3')).toBe('beta')
    expect(lineFromVersion('4.0.0-canary.9')).toBe('canary')
    expect(lineFromVersion('3.85.2')).toBe('latest')
  })
})

describe('findChangelogBaseTag', () => {
  const tags = [
    'v4.0.0-canary.7',
    'v4.0.0-canary.8', // dangling: tagged but never published
    'v4.0.0-beta.0',
    'v3.99.0-beta.1', // different major, same line — must be ignored
  ]

  it('should skip a dangling (unpublished) same-line tag for the prior published one', async () => {
    const isPublished = vi.fn(async ({ version }) => version !== '4.0.0-canary.8')

    const base = await findChangelogBaseTag({
      version: '4.0.0-canary.9',
      listTags: () => tags,
      isPublished,
    })

    expect(base).toBe('v4.0.0-canary.7')
  })

  it('should ignore a published beta when releasing a canary (same major, other line)', async () => {
    const isPublished = vi.fn(async () => true)

    const base = await findChangelogBaseTag({
      version: '4.0.0-canary.9',
      listTags: () => tags,
      isPublished,
    })

    expect(base).toBe('v4.0.0-canary.8') // latest published same-line, not the beta
  })

  it('should fall back to the latest published same-major tag of any line when first on its line', async () => {
    const isPublished = vi.fn(async () => true)

    const base = await findChangelogBaseTag({
      version: '4.0.0-beta.5',
      listTags: () => ['v4.0.0-canary.8', 'v4.0.0-beta.5'],
      isPublished,
    })

    // No other beta tag; fall back to latest published same-major (the canary).
    expect(base).toBe('v4.0.0-canary.8')
  })

  it('should return undefined when there are no candidate tags', async () => {
    const base = await findChangelogBaseTag({
      version: '4.0.0-canary.0',
      listTags: () => [],
      isPublished: vi.fn(async () => true),
    })

    expect(base).toBeUndefined()
  })

  it('should ignore a published different-major same-line tag entirely (no cross-major base)', async () => {
    const isPublished = vi.fn(async () => true)

    const base = await findChangelogBaseTag({
      version: '4.0.0-beta.0',
      listTags: () => ['v3.99.0-beta.9'],
      isPublished,
    })

    // Only candidate is a v3 beta; same-major filter excludes it, so there is no base.
    // (If the major filter were removed, this would wrongly return 'v3.99.0-beta.9'.)
    expect(base).toBeUndefined()
  })
})
