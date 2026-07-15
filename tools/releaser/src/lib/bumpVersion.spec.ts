import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('fs-extra', () => {
  const readJSON = vi.fn(async () => ({ version: '4.0.0-canary.9' }))
  const writeJSON = vi.fn(async () => undefined)
  return { default: { readJSON, writeJSON }, readJSON, writeJSON }
})
vi.mock('./getPackageDetails.js', () => ({
  getPackageDetails: vi.fn(async () => []),
}))

import { getWorkspace } from './getWorkspace.js'

const stubRegistryCanary = (canary: string): void => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ json: async () => ({ 'dist-tags': { canary } }) })),
  )
}

describe('bumpVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should accept a prerelease type and apply the beta preid, returning the new version', async () => {
    const workspace = await getWorkspace()

    const next = await workspace.bumpVersion('prerelease', { preid: 'beta' })

    // 4.0.0-canary.9 --prerelease --preid beta -> 4.0.0-beta.0
    expect(next).toBe('4.0.0-beta.0')
  })

  it('should accept a prerelease type and apply the canary preid, returning the new version', async () => {
    const workspace = await getWorkspace()

    const next = await workspace.bumpVersion('prerelease', { preid: 'canary' })

    // 4.0.0-canary.9 --prerelease --preid canary -> 4.0.0-canary.10
    expect(next).toBe('4.0.0-canary.10')
  })

  // The live canary path (publish-prerelease.ts calls bumpVersion('canary')):
  // derives the next iteration from the registry's current canary dist-tag, NOT
  // from the committed version. This legacy registry-fetch derivation is slated
  // for removal once canary derives from the committed version.
  it('should increment the canary iteration from the registry dist-tag', async () => {
    stubRegistryCanary('4.0.0-canary.9')
    const workspace = await getWorkspace()

    const next = await workspace.bumpVersion('canary')

    expect(next).toBe('4.0.0-canary.10')
  })

  it('should reset the canary iteration to 0 when the registry canary is on a different minor base', async () => {
    stubRegistryCanary('3.99.0-canary.5')
    const workspace = await getWorkspace()

    const next = await workspace.bumpVersion('canary')

    // committed 4.0.0-canary.9 --minor -> 4.0.0 base; registry mismatch -> .0
    expect(next).toBe('4.0.0-canary.0')
  })
})
