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
    const config = {
      ...minimalConfig,
      baseAccess,
    }
    const global: GlobalConfig = {
      slug: 'settings',
      access: {
        update: globalAccess,
      },
      fields: [],
    }
    const req = {
      payload: {
        config,
      },
    } as any

    const result = sanitizeGlobal(config, global)
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

  it('should not grant access when resource access uses the authenticated fallback', async () => {
    const config = {
      ...minimalConfig,
      baseAccess: () => true,
    }
    const global: GlobalConfig = {
      slug: 'settings',
      fields: [],
    }

    const result = sanitizeGlobal(config, global)

    expect(
      await result.access.readVersions?.({
        req: {
          payload: {
            config,
          },
        } as any,
      }),
    ).toBe(false)
    expect(
      await result.access.readVersions?.({
        req: {
          payload: {
            config,
          },
          user: {
            id: 'user-1',
          },
        } as any,
      }),
    ).toBe(true)
  })

  it('should resolve base access from the current request for reused resources', async () => {
    const global: GlobalConfig = {
      slug: 'settings',
      access: {
        read: () => true,
      },
      fields: [],
    }
    const deniedConfig = {
      ...minimalConfig,
      baseAccess: () => false,
    }
    const allowedConfig = {
      ...minimalConfig,
      baseAccess: () => true,
    }

    const firstResult = sanitizeGlobal(deniedConfig, global)
    expect(
      await firstResult.access.read({
        req: {
          payload: {
            config: deniedConfig,
          },
        } as any,
      }),
    ).toBe(false)

    const reusedResult = sanitizeGlobal(allowedConfig, global)
    expect(
      await reusedResult.access.read({
        req: {
          payload: {
            config: allowedConfig,
          },
        } as any,
      }),
    ).toBe(true)
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
