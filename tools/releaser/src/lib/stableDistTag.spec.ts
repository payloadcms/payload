import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { StableDistTag } from './stableDistTag.js'

import {
  assertStableDistTagSafe,
  publishWithStableDistTag,
  resolveStableDistTags,
  selectStableDistTag,
} from './stableDistTag.js'

describe('selectStableDistTag', () => {
  it.each([
    [undefined, 'latest'],
    ['3.90.2', 'latest'],
    ['4.0.0', 'payload-3'],
    ['4.0.0-beta.1', 'payload-3'],
    ['5.1.0', 'payload-3'],
  ])('should map npm latest %s to %s', (latestVersion, expected) => {
    expect(selectStableDistTag({ latestVersion, name: 'payload' })).toBe(expected)
  })

  it('should throw with the version and package name when npm latest is not valid semver', () => {
    expect(() => selectStableDistTag({ latestVersion: 'garbage', name: '@payloadcms/ui' })).toThrow(
      /"garbage" of @payloadcms\/ui/,
    )
  })
})

describe('assertStableDistTagSafe', () => {
  it('should throw for a tag outside latest and payload-3', () => {
    expect(() =>
      assertStableDistTagSafe({ name: 'payload', latestVersion: '3.0.0', tag: 'beta' }),
    ).toThrow(/beta/)
  })

  it('should throw for latest when npm latest is v4', () => {
    expect(() =>
      assertStableDistTagSafe({ name: '@payloadcms/ui', latestVersion: '4.0.0', tag: 'latest' }),
    ).toThrow(/@payloadcms\/ui/)
  })

  it('should throw for latest when npm latest is a v4 prerelease', () => {
    expect(() =>
      assertStableDistTagSafe({ name: 'payload', latestVersion: '4.0.0-beta.1', tag: 'latest' }),
    ).toThrow(/4\.0\.0-beta\.1/)
  })

  it('should throw for latest when npm latest is not valid semver', () => {
    expect(() =>
      assertStableDistTagSafe({ name: 'payload', latestVersion: 'garbage', tag: 'latest' }),
    ).toThrow(/garbage/)
  })

  it('should pass for payload-3 when npm latest is v4', () => {
    expect(() =>
      assertStableDistTagSafe({ name: 'payload', latestVersion: '4.0.0', tag: 'payload-3' }),
    ).not.toThrow()
  })

  it('should pass for latest when npm latest is v3', () => {
    expect(() =>
      assertStableDistTagSafe({ name: 'payload', latestVersion: '3.90.2', tag: 'latest' }),
    ).not.toThrow()
  })

  it('should pass for latest when the package was never published', () => {
    expect(() =>
      assertStableDistTagSafe({ name: 'payload', latestVersion: undefined, tag: 'latest' }),
    ).not.toThrow()
  })
})

describe('resolveStableDistTags', () => {
  it('should map each package to its own tag', async () => {
    const versions: Record<string, string | undefined> = {
      '@payloadcms/new-pkg': undefined,
      '@payloadcms/richtext-slate': '3.90.2',
      payload: '4.0.0',
    }

    const result = await resolveStableDistTags({
      getLatestVersion: async ({ name }) => versions[name],
      names: Object.keys(versions),
    })

    expect(result.get('payload')).toBe('payload-3')
    expect(result.get('@payloadcms/richtext-slate')).toBe('latest')
    expect(result.get('@payloadcms/new-pkg')).toBe('latest')
  })

  it('should throw when the registry read fails', async () => {
    await expect(
      resolveStableDistTags({
        getLatestVersion: async ({ name }) => {
          if (name === 'payload') {
            throw new Error('registry down')
          }
          return '3.0.0'
        },
        names: ['payload', '@payloadcms/ui'],
      }),
    ).rejects.toThrow('registry down')
  })
})

describe('publishWithStableDistTag', () => {
  const pkg = { name: 'payload' }
  const latestTags = new Map<string, StableDistTag>([['payload', 'latest']])
  const publish = vi.fn(async ({ tag }: { tag: StableDistTag }) => ({
    name: `payload@${tag}`,
    success: true,
  }))

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should re-read npm latest and publish with the resolved tag when the guard passes', async () => {
    const getLatestVersion = vi.fn(async () => '3.90.2')

    const result = await publishWithStableDistTag({
      distTags: latestTags,
      getLatestVersion,
      pkg,
      publish,
    })

    expect(getLatestVersion).toHaveBeenCalledWith({ name: 'payload' })
    expect(publish).toHaveBeenCalledWith({ tag: 'latest' })
    expect(result).toEqual({ name: 'payload@latest', success: true })
  })

  it('should fail without publishing when the package has no resolved tag', async () => {
    const result = await publishWithStableDistTag({
      distTags: new Map(),
      getLatestVersion: async () => '3.90.2',
      pkg,
      publish,
    })

    expect(result).toMatchObject({ name: 'payload', success: false })
    expect(publish).not.toHaveBeenCalled()
  })

  it('should fail without publishing when the re-read is rejected by the registry', async () => {
    const result = await publishWithStableDistTag({
      distTags: latestTags,
      getLatestVersion: async () => {
        throw new Error('503 Service Unavailable')
      },
      pkg,
      publish,
    })

    expect(result).toMatchObject({ name: 'payload', success: false })
    expect(result.details).toMatch(/503/)
    expect(publish).not.toHaveBeenCalled()
  })

  it('should fail without publishing when npm latest moved to v4 after resolution', async () => {
    const result = await publishWithStableDistTag({
      distTags: latestTags,
      getLatestVersion: async () => '4.0.0',
      pkg,
      publish,
    })

    expect(result).toMatchObject({ name: 'payload', success: false })
    expect(result.details).toMatch(/4\.0\.0/)
    expect(publish).not.toHaveBeenCalled()
  })

  it('should skip the registry read in dry-run', async () => {
    const getLatestVersion = vi.fn(async () => '4.0.0')

    await publishWithStableDistTag({
      distTags: latestTags,
      dryRun: true,
      getLatestVersion,
      pkg,
      publish,
    })

    expect(getLatestVersion).not.toHaveBeenCalled()
    expect(publish).toHaveBeenCalledWith({ tag: 'latest' })
  })
})
