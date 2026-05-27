import { describe, expect, it, vi } from 'vitest'

import { sanitizeDependencies } from './sanitizeDependencies.js'

describe('sanitizeDependencies', () => {
  it('returns a record always containing a payload entry', async () => {
    const deps = await sanitizeDependencies()
    expect(deps.payload).toMatch(/^\d+\.\d+\.\d+/)
  })

  it('returns alphabetically sorted keys', async () => {
    const deps = await sanitizeDependencies()
    const keys = Object.keys(deps)
    const sorted = [...keys].sort((a, b) => a.localeCompare(b))
    expect(keys).toEqual(sorted)
  })

  it('falls back to a payload-only map when getDependencies throws', async () => {
    vi.doMock('../utilities/dependencies/getDependencies.js', () => ({
      getDependencies: () => Promise.reject(new Error('boom')),
    }))
    vi.resetModules()
    const { sanitizeDependencies: freshSanitize } = await import('./sanitizeDependencies.js')
    const deps = await freshSanitize()
    expect(Object.keys(deps)).toEqual(['payload'])
    expect(deps.payload).toMatch(/^\d+\.\d+\.\d+/)
    vi.doUnmock('../utilities/dependencies/getDependencies.js')
  })
})
