import { existsSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

import type { RegistryPackument, UpgradeDeps } from './types.js'

import { runUpgrade } from './index.js'

const packuments: Record<string, RegistryPackument> = {
  '@payloadcms/next': {
    'dist-tags': { canary: '4.0.0-canary.20' },
    versions: { '4.0.0-canary.20': { peerDependencies: { next: '>=16.2.6 <17.0.0' } } },
  },
  '@types/node': { versions: { '24.12.3': {} } },
  next: { versions: { '16.9.3': {} } },
  payload: {
    'dist-tags': { canary: '4.0.0-canary.20' },
    versions: { '4.0.0-canary.20': { engines: { node: '>=24.15.0' } } },
  },
}

const makeDeps = (overrides: Partial<UpgradeDeps> = {}): UpgradeDeps => ({
  // Real fs so the temp-project package.json is found; no lockfile -> npm.
  exists: existsSync,
  fetchRegistry: (name) => Promise.resolve(packuments[name] ?? {}),
  spawn: vi.fn().mockResolvedValue({ code: 0 }),
  ...overrides,
})

const makeProject = (): string => {
  const dir = mkdtempSync(join(tmpdir(), 'codemod-upgrade-'))
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ dependencies: { payload: '^3.0.0' } }, null, 2) + '\n',
  )
  return dir
}

describe('runUpgrade', () => {
  it('installs before running transforms', async () => {
    const order: string[] = []
    const spawn = vi.fn().mockImplementation(() => {
      order.push('install')
      return Promise.resolve({ code: 0 })
    })
    const runTransforms = vi.fn().mockImplementation(() => {
      order.push('transforms')
      return Promise.resolve({ failed: false, results: [] })
    })

    await runUpgrade(
      { flags: { dry: false, force: true, tag: 'canary' }, path: makeProject() },
      makeDeps({ spawn }),
      { runTransforms },
    )

    expect(order).toEqual(['install', 'transforms'])
  })

  it('aborts before transforms when install fails', async () => {
    const runTransforms = vi.fn()

    const result = await runUpgrade(
      {
        flags: { dry: false, force: true, tag: 'canary' },
        path: makeProject(),
      },
      makeDeps({ spawn: vi.fn().mockResolvedValue({ code: 1 }) }),
      { runTransforms },
    )

    expect(runTransforms).not.toHaveBeenCalled()
    expect(result.failed).toBe(true)
  })

  it('dry run writes nothing, does not install or transform', async () => {
    const spawn = vi.fn()
    const runTransforms = vi.fn()

    await runUpgrade(
      { flags: { dry: true, force: true, tag: 'canary' }, path: makeProject() },
      makeDeps({ spawn }),
      { runTransforms },
    )

    expect(spawn).not.toHaveBeenCalled()
    expect(runTransforms).not.toHaveBeenCalled()
  })
})
