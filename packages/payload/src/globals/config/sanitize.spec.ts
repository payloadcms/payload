import type { GlobalConfig } from './types.js'
import type { PayloadRequest } from '../../types/index.js'

import { describe, expect, it, vi } from 'vitest'

import { sanitizeGlobal } from './sanitize.js'

const minimalConfig = {
  collections: [],
  globals: [],
} as any

const req = {
  payload: {
    config: minimalConfig,
  },
} as PayloadRequest

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
      baseAccess: {
        globals: {
          update: baseAccess,
        },
      },
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
    const accessResult = await result.access.update({ req, slug: 'settings' })

    expect(accessResult).toEqual({
      and: [baseConstraint, globalConstraint],
    })
    expect(baseAccess).toHaveBeenCalledWith({
      data: undefined,
      id: undefined,
      isReadingStaticFile: undefined,
      req,
      slug: 'settings',
    })
    expect(globalAccess).toHaveBeenCalledWith({
      data: undefined,
      id: undefined,
      isReadingStaticFile: undefined,
      req,
      slug: 'settings',
    })
  })

  it('should inherit the effective read constraint for readVersions', async () => {
    const config = {
      ...minimalConfig,
      baseAccess: {
        globals: {
          read: () => ({
            tenant: {
              equals: 'tenant-1',
            },
          }),
        },
      },
    }
    const global: GlobalConfig = {
      slug: 'settings',
      access: {
        read: () => true,
      },
      fields: [],
      versions: true,
    }
    const req = {
      payload: {
        config,
      },
    } as any

    const result = sanitizeGlobal(config, global)

    await expect(result.access.readVersions({ req, slug: 'settings' })).resolves.toEqual({
      'version.tenant': {
        equals: 'tenant-1',
      },
    })
  })

  it('should not apply collection base access to globals', async () => {
    const collectionBaseAccess = vi.fn(() => false)
    const globalAccess = vi.fn(() => true)
    const config = {
      ...minimalConfig,
      baseAccess: {
        collections: {
          update: collectionBaseAccess,
        },
      },
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

    expect(await result.access.update({ req, slug: 'settings' })).toBe(true)
    expect(globalAccess).toHaveBeenCalledOnce()
    expect(collectionBaseAccess).not.toHaveBeenCalled()
  })

  it('should not grant access when resource access uses the authenticated fallback', async () => {
    const config = {
      ...minimalConfig,
      admin: {
        user: 'users',
      },
      baseAccess: {
        globals: {
          readVersions: () => true,
        },
      },
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
        slug: 'settings',
      }),
    ).toBe(false)
    expect(
      await result.access.readVersions?.({
        req: {
          payload: {
            config,
          },
          user: {
            collection: 'users',
            id: 'user-1',
          },
        } as any,
        slug: 'settings',
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
      baseAccess: {
        globals: {
          read: () => false,
        },
      },
    }
    const allowedConfig = {
      ...minimalConfig,
      baseAccess: {
        globals: {
          read: () => true,
        },
      },
    }

    const firstResult = sanitizeGlobal(deniedConfig, global)
    expect(
      await firstResult.access.read({
        req: {
          payload: {
            config: deniedConfig,
          },
        } as any,
        slug: 'settings',
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
        slug: 'settings',
      }),
    ).toBe(true)
  })
})

describe('sanitizeGlobal', () => {
  it('should populate sanitized global defaults for a minimal config', () => {
    const global: GlobalConfig = {
      slug: 'header',
      fields: [],
    }

    const result = sanitizeGlobal(minimalConfig, global)

    expect(result).toMatchObject({
      _sanitized: true,
      access: {
        read: expect.any(Function),
        update: expect.any(Function),
      },
      admin: {},
      custom: {},
      endpoints: expect.any(Array),
      fields: expect.any(Array),
      flattenedFields: expect.any(Array),
      hooks: {
        afterChange: [],
        afterRead: [],
        beforeChange: [],
        beforeOperation: [],
        beforeRead: [],
        beforeValidate: [],
      },
      label: 'Header',
      slug: 'header',
    })
    // Versions default to enabled, so `readVersions` is wrapped to apply base access.
    expect(result.access.readVersions).toEqual(expect.any(Function))
    expect(result.admin.components).toBeUndefined()
    expect(result.graphQL).toBeUndefined()
    expect(result.lockDocuments).toBeUndefined()
    expect(result.typescript).toBeUndefined()
  })

  it('should populate a nested default when the property is explicitly undefined', () => {
    const global: GlobalConfig = {
      access: {
        read: undefined,
      },
      hooks: {
        beforeOperation: undefined,
      },
      slug: 'header',
      fields: [],
    }

    const result = sanitizeGlobal(minimalConfig, global)

    expect(result.access.read).toEqual(expect.any(Function))
    expect(result.hooks.beforeOperation).toEqual([])
  })

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

  it('should use an explicit readVersions access function instead of read access', async () => {
    const result = sanitizeGlobal(minimalConfig, {
      slug: 'header',
      fields: [],
      access: { read: () => false, readVersions: () => true },
    })

    await expect(result.access.readVersions({ req })).resolves.toBe(true)
  })

  it.each([true, false])(
    'should pass through a %s result from read access to readVersions',
    async (readResult) => {
      const result = sanitizeGlobal(minimalConfig, {
        slug: 'header',
        fields: [],
        access: { read: async () => readResult },
      })

      await expect(result.access.readVersions({ req })).resolves.toBe(readResult)
    },
  )

  it('should translate inherited read queries to global version fields', async () => {
    const result = sanitizeGlobal(minimalConfig, {
      slug: 'header',
      fields: [],
      access: {
        read: async () => ({
          or: [{ title: { equals: 'Header' } }, { visible: { equals: true } }],
        }),
      },
    })

    await expect(result.access.readVersions({ req })).resolves.toEqual({
      or: [{ 'version.title': { equals: 'Header' } }, { 'version.visible': { equals: true } }],
    })
  })
})
