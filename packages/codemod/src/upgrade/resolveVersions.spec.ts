import { describe, expect, it } from 'vitest'

import type { FetchRegistry, RegistryPackument } from './types.js'

import { resolveVersions } from './resolveVersions.js'

const packuments: Record<string, RegistryPackument> = {
  '@payloadcms/next': {
    'dist-tags': { canary: '4.0.0-canary.20' },
    versions: {
      '4.0.0-canary.20': { peerDependencies: { next: '>=16.2.6 <17.0.0' } },
    },
  },
  '@types/node': {
    'dist-tags': { latest: '24.12.3' },
    versions: {
      '22.9.0': {},
      '24.10.0': {},
      '24.12.3': {},
      '25.0.0': {},
    },
  },
  next: {
    'dist-tags': { latest: '16.9.3' },
    versions: {
      '15.5.0': {},
      '16.2.6': {},
      '16.9.3': {},
      '17.0.0': {},
    },
  },
  payload: {
    'dist-tags': { canary: '4.0.0-canary.20' },
    versions: {
      '4.0.0-canary.20': { engines: { node: '>=24.15.0' } },
    },
  },
}

const fetchRegistry: FetchRegistry = (name) => {
  const found = packuments[name]
  if (!found) {
    throw new Error(`unexpected fetch: ${name}`)
  }
  return Promise.resolve(found)
}

describe('resolveVersions', () => {
  it('computes the written targets and the report-only Next target', async () => {
    const resolved = await resolveVersions({ fetchRegistry, tag: 'canary' })

    expect(resolved).toEqual({
      enginesNode: '>=24.15.0',
      nextTarget: '16.9.3', // newest within >=16.2.6 <17, excludes 17.0.0
      payloadVersion: '4.0.0-canary.20',
      typesNode: '24.12.3', // newest within major 24, excludes 25.0.0
      typescript: '6.0.3',
    })
  })

  it('throws when the dist-tag is missing', async () => {
    await expect(
      resolveVersions({
        fetchRegistry: () => Promise.resolve({ 'dist-tags': {} }),
        tag: 'canary',
      }),
    ).rejects.toThrow(/dist-tag "canary"/)
  })
})
