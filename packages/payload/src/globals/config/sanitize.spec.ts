import type { GlobalConfig } from './types.js'

import { describe, expect, it, vi } from 'vitest'

import { sanitizeGlobal } from './sanitize.js'

const minimalConfig = {
  collections: [],
  globals: [],
} as any

describe('baseAccess', () => {
  it('should combine base and global access constraints', async () => {
    const baseConstraint = {
      tenant: {
        equals: 'tenant-1',
      },
    }
    const globalConstraint = {
      locale: {
        equals: 'en',
      },
    }
    const baseAccess = vi.fn(() => baseConstraint)
    const globalAccess = vi.fn(() => globalConstraint)
    const global: GlobalConfig = {
      slug: 'settings',
      access: {
        update: globalAccess,
      },
      fields: [],
    }
    const req = {} as any

    const result = sanitizeGlobal(
      {
        ...minimalConfig,
        baseAccess,
      },
      global,
    )
    const accessResult = await result.access.update({ req })

    expect(accessResult).toEqual({
      and: [baseConstraint, globalConstraint],
    })
    expect(baseAccess).toHaveBeenCalledWith({
      data: undefined,
      entityType: 'global',
      id: undefined,
      isReadingStaticFile: undefined,
      operation: 'update',
      req,
      slug: 'settings',
    })
  })
})

describe('sanitizeGlobal — versions default', () => {
  it('should default versions to true when not specified', () => {
    const global: GlobalConfig = {
      slug: 'header',
      fields: [],
    }

    const result = sanitizeGlobal(minimalConfig, global)

    expect(result.versions).toEqual({ drafts: false, max: 100 })
  })

  it('should preserve explicit versions: false', () => {
    const global: GlobalConfig = {
      slug: 'header',
      fields: [],
      versions: false,
    }

    const result = sanitizeGlobal(minimalConfig, global)

    expect(result.versions).toBe(false)
  })

  it('should preserve explicit versions object config', () => {
    const global: GlobalConfig = {
      slug: 'header',
      fields: [],
      versions: { drafts: true, max: 50 },
    }

    const result = sanitizeGlobal(minimalConfig, global)

    expect((result.versions as any).max).toBe(50)
    expect((result.versions as any).drafts).toBeTruthy()
  })
})
