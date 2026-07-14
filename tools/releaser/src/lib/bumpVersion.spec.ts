import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('fs-extra', () => {
  const readJSON = vi.fn(async () => ({ version: '4.0.0-canary.9' }))
  const writeJSON = vi.fn(async () => undefined)
  return { default: { readJSON, writeJSON }, readJSON, writeJSON }
})
vi.mock('./getPackageDetails.js', () => ({
  getPackageDetails: vi.fn(async () => []),
}))

import { getWorkspace } from './getWorkspace.js'

describe('bumpVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
