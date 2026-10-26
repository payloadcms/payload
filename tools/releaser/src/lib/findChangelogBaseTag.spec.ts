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
  it('should pick the highest published stable v3 tag', async () => {
    const base = await findChangelogBaseTag({
      version: '3.90.3',
      listTags: () => ['v3.90.1', 'v3.90.2'],
      isPublished: vi.fn(async () => true),
    })

    expect(base).toBe('v3.90.2')
  })

  it('should skip a dangling unpublished tag', async () => {
    const base = await findChangelogBaseTag({
      version: '3.90.3',
      listTags: () => ['v3.90.1', 'v3.90.2'],
      isPublished: vi.fn(async ({ version }) => version !== '3.90.2'),
    })

    expect(base).toBe('v3.90.1')
  })

  it('should skip a tag newer than the release version', async () => {
    const base = await findChangelogBaseTag({
      version: '3.90.2',
      listTags: () => ['v3.90.1', 'v3.90.2', 'v3.90.3'],
      isPublished: vi.fn(async () => true),
    })

    expect(base).toBe('v3.90.1')
  })

  it('should ignore v4 tags', async () => {
    const base = await findChangelogBaseTag({
      version: '3.90.3',
      listTags: () => ['v4.0.0-beta.0', 'v3.90.2'],
      isPublished: vi.fn(async () => true),
    })

    expect(base).toBe('v3.90.2')
  })

  it('should not pick a pre-3.0 alpha over a stable tag', async () => {
    const base = await findChangelogBaseTag({
      version: '3.90.3',
      listTags: () => ['v3.0.0-alpha.1', 'v3.90.2'],
      isPublished: vi.fn(async () => true),
    })

    expect(base).toBe('v3.90.2')
  })

  it('should return undefined when there are no candidate tags', async () => {
    const base = await findChangelogBaseTag({
      version: '3.90.3',
      listTags: () => [],
      isPublished: vi.fn(async () => true),
    })

    expect(base).toBeUndefined()
  })
})
