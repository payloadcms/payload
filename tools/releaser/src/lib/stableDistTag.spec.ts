import { describe, expect, it } from 'vitest'

import {
  assertStableDistTagSafe,
  resolveStableDistTags,
  selectStableDistTag,
} from './stableDistTag.js'

describe('selectStableDistTag', () => {
  it.each([
    [undefined, 'latest'],
    ['3.90.2', 'latest'],
    ['4.0.0', 'payload-3'],
    ['5.1.0', 'payload-3'],
  ])('should map npm latest %s to %s', (latestVersion, expected) => {
    expect(selectStableDistTag({ latestVersion })).toBe(expected)
  })

  it('should throw when npm latest is not valid semver', () => {
    expect(() => selectStableDistTag({ latestVersion: 'garbage' })).toThrow(/garbage/)
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
