import { EventEmitter } from 'node:events'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('child_process', () => ({ execSync: vi.fn(), spawn: vi.fn() }))
vi.mock('./getPackageRegistryVersions.js', () => ({
  getDistTagVersion: vi.fn(),
  isVersionPublished: vi.fn(),
}))
vi.mock('./getPackageDetails.js', () => ({ getPackageDetails: vi.fn() }))

import { spawn } from 'child_process'

import type { StableDistTag } from './stableDistTag.js'

import { getPackageDetails } from './getPackageDetails.js'
import { getDistTagVersion, isVersionPublished } from './getPackageRegistryVersions.js'
import { getWorkspace } from './getWorkspace.js'

const packages = [
  {
    name: 'payload',
    packagePath: 'packages/payload' as const,
    shortName: 'payload',
    version: '3.90.3',
  },
  {
    name: '@payloadcms/richtext-slate',
    packagePath: 'packages/richtext-slate' as const,
    shortName: 'richtext-slate',
    version: '3.90.3',
  },
]

const spawnExiting = (exitCode: number) => {
  const child = Object.assign(new EventEmitter(), {
    stderr: new EventEmitter(),
    stdout: new EventEmitter(),
  })
  queueMicrotask(() => child.emit('close', exitCode))
  return child
}

const spawnedTags = () =>
  vi.mocked(spawn).mock.calls.map(([, args]) => {
    const tagIndex = args.indexOf('--tag')
    return { path: args[args.indexOf('-C') + 1], tag: args[tagIndex + 1] }
  })

describe('workspace.publish tags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getPackageDetails).mockResolvedValue(packages)
    vi.mocked(getDistTagVersion).mockResolvedValue('3.90.2')
    vi.mocked(isVersionPublished).mockResolvedValue(false)
    vi.mocked(spawn).mockImplementation(() => spawnExiting(0) as never)
  })

  it('should pass each package its own tag from the map', async () => {
    const tags = new Map<string, StableDistTag>([
      ['payload', 'payload-3'],
      ['@payloadcms/richtext-slate', 'latest'],
    ])

    await getWorkspace().publish({ tag: tags })

    expect(spawnedTags()).toEqual([
      { path: 'packages/payload', tag: 'payload-3' },
      { path: 'packages/richtext-slate', tag: 'latest' },
    ])
  })

  it('should stop before publishing a package missing from the map', async () => {
    const tags = new Map<string, StableDistTag>([['payload', 'latest']])

    await expect(getWorkspace().publish({ tag: tags })).rejects.toThrow(
      /@payloadcms\/richtext-slate/,
    )

    expect(spawn).toHaveBeenCalledTimes(1)
  })

  it('should re-read npm latest for each package right before its publish', async () => {
    const tags = new Map<string, StableDistTag>([
      ['payload', 'latest'],
      ['@payloadcms/richtext-slate', 'latest'],
    ])

    await getWorkspace().publish({ tag: tags })

    const events = [
      ...vi
        .mocked(getDistTagVersion)
        .mock.invocationCallOrder.map((order) => ({ event: 'read', order })),
      ...vi.mocked(spawn).mock.invocationCallOrder.map((order) => ({ event: 'spawn', order })),
    ]
      .sort((a, b) => a.order - b.order)
      .map(({ event }) => event)

    expect(vi.mocked(getDistTagVersion).mock.calls).toEqual([
      [{ name: 'payload', tag: 'latest' }],
      [{ name: '@payloadcms/richtext-slate', tag: 'latest' }],
    ])
    expect(events).toEqual(['read', 'spawn', 'read', 'spawn'])
  })

  it('should stop before spawning a package whose re-read is rejected by the registry', async () => {
    vi.mocked(getDistTagVersion).mockImplementation(async ({ name }) => {
      if (name === '@payloadcms/richtext-slate') {
        throw new Error('503 Service Unavailable')
      }
      return '3.90.2'
    })
    const tags = new Map<string, StableDistTag>([
      ['payload', 'latest'],
      ['@payloadcms/richtext-slate', 'latest'],
    ])

    await expect(getWorkspace().publish({ tag: tags })).rejects.toThrow(
      /@payloadcms\/richtext-slate/,
    )

    expect(spawnedTags()).toEqual([{ path: 'packages/payload', tag: 'latest' }])
  })

  it('should stop before spawning when npm latest moved to v4 after resolution', async () => {
    vi.mocked(getDistTagVersion).mockResolvedValue('4.0.0')
    const tags = new Map<string, StableDistTag>([
      ['payload', 'latest'],
      ['@payloadcms/richtext-slate', 'latest'],
    ])

    await expect(getWorkspace().publish({ tag: tags })).rejects.toThrow(/payload/)

    expect(spawn).not.toHaveBeenCalled()
  })

  it('should apply a string tag to every package', async () => {
    await getWorkspace().publish({ tag: 'internal' })

    expect(spawnedTags()).toEqual([
      { path: 'packages/payload', tag: 'internal' },
      { path: 'packages/richtext-slate', tag: 'internal' },
    ])
  })
})
