import { describe, expect, it, vi } from 'vitest'

import {
  assertCanaryVersionFromHead,
  getCanarySentinelShortNames,
  isCanaryAtHead,
} from './canarySentinels.js'
import { packagePublishList } from './publishList.js'

const head = 'head123'
const version = '4.0.0-canary.20261112'
const sentinelNames = ['@payloadcms/translations', 'payload', '@payloadcms/codemod']

const fakeRegistry = ({
  canaryByName = {},
  commitByName = {},
  publishedNames = [],
}: {
  canaryByName?: Record<string, string | undefined>
  commitByName?: Record<string, string | undefined>
  publishedNames?: string[]
}) => ({
  getDistTag: vi.fn(async ({ name }: { name: string }) => canaryByName[name]),
  getProvenanceCommit: vi.fn(async ({ name }: { name: string }) => commitByName[name]),
  isVersionPublished: vi.fn(async ({ name }: { name: string }) => publishedNames.includes(name)),
})

const allNames = <T>(value: T): Record<string, T> =>
  Object.fromEntries(sentinelNames.map((name) => [name, value]))

describe('getCanarySentinelShortNames', () => {
  it('should pick the first, payload, and the last of the publish list', () => {
    expect(getCanarySentinelShortNames({ publishList: packagePublishList })).toEqual([
      packagePublishList[0],
      'payload',
      packagePublishList.at(-1),
    ])
  })

  it('should follow the list by index when a package is appended', () => {
    expect(
      getCanarySentinelShortNames({ publishList: [...packagePublishList, 'new-pkg'] }).at(-1),
    ).toBe('new-pkg')
  })

  it('should not repeat payload when it is first or last', () => {
    expect(getCanarySentinelShortNames({ publishList: ['payload', 'ui'] })).toEqual([
      'payload',
      'ui',
    ])
  })
})

describe('isCanaryAtHead', () => {
  it('should return true when every sentinel canary has provenance at HEAD', async () => {
    const registry = fakeRegistry({ canaryByName: allNames(version), commitByName: allNames(head) })

    expect(await isCanaryAtHead({ head, log: vi.fn(), registry, sentinelNames })).toBe(true)
    expect(registry.getProvenanceCommit).toHaveBeenCalledWith({ name: 'payload', version })
  })

  it('should return false when one sentinel is at another commit', async () => {
    const registry = fakeRegistry({
      canaryByName: allNames(version),
      commitByName: { ...allNames(head), '@payloadcms/codemod': 'old456' },
    })
    const log = vi.fn()

    expect(await isCanaryAtHead({ head, log, registry, sentinelNames })).toBe(false)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('@payloadcms/codemod'))
  })

  it('should return false when sentinels from HEAD have different canary versions', async () => {
    const registry = fakeRegistry({
      canaryByName: { ...allNames(version), '@payloadcms/codemod': '4.0.0-canary.20261111' },
      commitByName: allNames(head),
    })
    const log = vi.fn()

    expect(await isCanaryAtHead({ head, log, registry, sentinelNames })).toBe(false)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('4.0.0-canary.20261111'))
  })

  it('should return false when a sentinel has no canary dist-tag', async () => {
    const registry = fakeRegistry({
      canaryByName: { ...allNames(version), '@payloadcms/codemod': undefined },
      commitByName: allNames(head),
    })

    expect(await isCanaryAtHead({ head, log: vi.fn(), registry, sentinelNames })).toBe(false)
  })

  it('should return false when a sentinel canary has no provenance', async () => {
    const registry = fakeRegistry({
      canaryByName: allNames(version),
      commitByName: { ...allNames(head), payload: undefined },
    })

    expect(await isCanaryAtHead({ head, log: vi.fn(), registry, sentinelNames })).toBe(false)
  })

  it('should return false and log when the registry throws', async () => {
    const registry = fakeRegistry({ canaryByName: allNames(version), commitByName: allNames(head) })
    registry.getDistTag.mockRejectedValueOnce(new Error('registry down'))
    const log = vi.fn()

    expect(await isCanaryAtHead({ head, log, registry, sentinelNames })).toBe(false)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('registry down'))
  })

  it('should return false and log when the provenance read throws', async () => {
    const registry = fakeRegistry({ canaryByName: allNames(version), commitByName: allNames(head) })
    registry.getProvenanceCommit.mockRejectedValueOnce(new Error('bad attestation JSON'))
    const log = vi.fn()

    expect(await isCanaryAtHead({ head, log, registry, sentinelNames })).toBe(false)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('bad attestation JSON'))
  })
})

describe('assertCanaryVersionFromHead', () => {
  it('should pass when no sentinel has the version', async () => {
    const registry = fakeRegistry({})

    await expect(
      assertCanaryVersionFromHead({ head, registry, sentinelNames, version }),
    ).resolves.toBeUndefined()
    expect(registry.getProvenanceCommit).not.toHaveBeenCalled()
  })

  it('should pass when every published sentinel came from HEAD', async () => {
    const registry = fakeRegistry({
      commitByName: allNames(head),
      publishedNames: ['@payloadcms/translations', 'payload'],
    })

    await expect(
      assertCanaryVersionFromHead({ head, registry, sentinelNames, version }),
    ).resolves.toBeUndefined()
  })

  it('should throw naming the other commit when a sentinel came from another commit', async () => {
    const registry = fakeRegistry({
      commitByName: { '@payloadcms/translations': 'abc123' },
      publishedNames: ['@payloadcms/translations'],
    })

    await expect(
      assertCanaryVersionFromHead({ head, registry, sentinelNames, version }),
    ).rejects.toThrow(
      '4.0.0-canary.20261112 already published from abc123 (@payloadcms/translations); one canary per UTC day',
    )
  })

  it('should throw when the version exists but provenance is missing', async () => {
    const registry = fakeRegistry({ publishedNames: ['payload'] })

    await expect(
      assertCanaryVersionFromHead({ head, registry, sentinelNames, version }),
    ).rejects.toThrow('already published from an unknown commit (payload)')
  })

  it('should throw when the registry throws', async () => {
    const registry = fakeRegistry({})
    registry.isVersionPublished.mockRejectedValueOnce(new Error('registry down'))

    await expect(
      assertCanaryVersionFromHead({ head, registry, sentinelNames, version }),
    ).rejects.toThrow('registry down')
  })
})
