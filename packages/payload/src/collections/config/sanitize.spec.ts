import type { CollectionConfig } from './types.js'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sanitizeCollection, warnOnInvalidCustomViews } from './sanitize.js'

describe('baseAccess', () => {
  it('should combine base and collection access constraints', async () => {
    const baseConstraint = {
      tenant: {
        equals: 'tenant-1',
      },
    }
    const collectionConstraint = {
      status: {
        equals: 'published',
      },
    }
    const baseAccess = vi.fn(() => baseConstraint)
    const collectionAccess = vi.fn(() => collectionConstraint)
    const config = {
      baseAccess: {
        collections: {
          read: baseAccess,
        },
      },
      collections: [],
      globals: [],
    } as any
    const collection: CollectionConfig = {
      slug: 'posts',
      access: {
        read: collectionAccess,
      },
      fields: [],
    }
    const req = {
      payload: {
        config,
      },
    } as any

    const result = sanitizeCollection(config, collection)
    const accessResult = await result.access.read({ req })

    expect(accessResult).toEqual({
      and: [baseConstraint, collectionConstraint],
    })
    expect(baseAccess).toHaveBeenCalledWith({
      data: undefined,
      id: undefined,
      isReadingStaticFile: undefined,
      req,
      slug: 'posts',
    })
  })

  it('should not run collection access when base access denies the operation', async () => {
    const collectionAccess = vi.fn(() => true)
    const config = {
      baseAccess: {
        collections: {
          update: () => false,
        },
      },
      collections: [],
      globals: [],
    } as any
    const collection: CollectionConfig = {
      slug: 'posts',
      access: {
        update: collectionAccess,
      },
      fields: [],
    }
    const req = {
      payload: {
        config,
      },
    } as any

    const result = sanitizeCollection(config, collection)
    const accessResult = await result.access.update({ req })

    expect(accessResult).toBe(false)
    expect(collectionAccess).not.toHaveBeenCalled()
  })

  it('should only apply the base function for the matching operation', async () => {
    const baseReadAccess = vi.fn(() => false)
    const collectionUpdateAccess = vi.fn(() => true)
    const config = {
      baseAccess: {
        collections: {
          read: baseReadAccess,
        },
      },
      collections: [],
      globals: [],
    } as any
    const collection: CollectionConfig = {
      slug: 'posts',
      access: {
        update: collectionUpdateAccess,
      },
      fields: [],
    }
    const req = {
      payload: {
        config,
      },
    } as any

    const result = sanitizeCollection(config, collection)

    expect(await result.access.update({ req })).toBe(true)
    expect(collectionUpdateAccess).toHaveBeenCalledOnce()
    expect(baseReadAccess).not.toHaveBeenCalled()
  })

  it('should fail closed when base access returns undefined', async () => {
    const collectionAccess = vi.fn(() => true)
    const config = {
      baseAccess: {
        collections: {
          read: (() => undefined) as any,
        },
      },
      collections: [],
      globals: [],
    } as any
    const collection: CollectionConfig = {
      slug: 'posts',
      access: {
        read: collectionAccess,
      },
      fields: [],
    }
    const req = {
      payload: {
        config,
      },
    } as any

    const result = sanitizeCollection(config, collection)

    expect(await result.access.read({ req })).toBe(false)
    expect(collectionAccess).not.toHaveBeenCalled()
  })

  it('should fail closed when collection access returns undefined', async () => {
    const config = {
      baseAccess: {
        collections: {
          read: () => true,
        },
      },
      collections: [],
      globals: [],
    } as any
    const collection: CollectionConfig = {
      slug: 'posts',
      access: {
        read: (() => undefined) as any,
      },
      fields: [],
    }
    const req = {
      payload: {
        config,
      },
    } as any

    const result = sanitizeCollection(config, collection)

    expect(await result.access.read({ req })).toBe(false)
  })

  it('should not apply base access to auth collection admin access', async () => {
    const adminAccess = vi.fn(() => true)
    const baseAccess = vi.fn(() => false)
    const config = {
      baseAccess: {
        collections: {
          read: baseAccess,
        },
      },
      collections: [],
      globals: [],
    } as any
    const collection: CollectionConfig = {
      slug: 'users',
      access: {
        admin: adminAccess,
      },
      auth: true,
      fields: [],
    }
    const req = {
      payload: {
        config,
      },
    } as any

    const result = sanitizeCollection(config, collection)

    expect(await result.access.admin({ req })).toBe(true)
    expect(adminAccess).toHaveBeenCalledOnce()
    expect(baseAccess).not.toHaveBeenCalled()
  })

  it('should reject query constraints for collection create operations', async () => {
    const config = {
      baseAccess: {
        collections: {
          create: () => ({
            tenant: {
              equals: 'tenant-1',
            },
          }),
        },
      },
      collections: [],
      globals: [],
    } as any
    const collection: CollectionConfig = {
      slug: 'posts',
      fields: [],
    }
    const req = {
      payload: {
        config,
      },
    } as any

    const result = sanitizeCollection(config, collection)

    await expect(result.access.create({ req })).rejects.toThrow(
      'baseAccess must return a boolean for collection create operations.',
    )
  })
})

describe('warnOnInvalidCustomViews', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('should warn when a custom view is missing path', () => {
    const collection: CollectionConfig = {
      slug: 'my-collection',
      fields: [],
      admin: {
        components: {
          views: {
            grid: {
              Component: '/components/GridView/index.js#GridView',
            } as any,
          },
        },
      },
    }

    warnOnInvalidCustomViews(collection)

    expect(warnSpy).toHaveBeenCalledOnce()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"grid"'))
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"my-collection"'))
  })

  it('should not warn when a custom view has a path', () => {
    const collection: CollectionConfig = {
      slug: 'my-collection',
      fields: [],
      admin: {
        components: {
          views: {
            grid: {
              Component: '/components/GridView/index.js#GridView',
              path: '/grid',
            },
          },
        },
      },
    }

    warnOnInvalidCustomViews(collection)

    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('should not warn for built-in "edit" or "list" keys even without path', () => {
    const collection: CollectionConfig = {
      slug: 'my-collection',
      fields: [],
      admin: {
        components: {
          views: {
            edit: { default: { Component: '/components/Edit/index.js#Edit' } },
            list: { Component: '/components/List/index.js#List' },
          },
        },
      },
    }

    warnOnInvalidCustomViews(collection)

    expect(warnSpy).not.toHaveBeenCalled()
  })

  it('should warn for each custom view missing path independently', () => {
    const collection: CollectionConfig = {
      slug: 'my-collection',
      fields: [],
      admin: {
        components: {
          views: {
            grid: { Component: '/components/GridView/index.js#GridView' } as any,
            map: { Component: '/components/MapView/index.js#MapView' } as any,
          },
        },
      },
    }

    warnOnInvalidCustomViews(collection)

    expect(warnSpy).toHaveBeenCalledTimes(2)
  })

  it('should warn when a custom view has a path but is missing Component', () => {
    const collection: CollectionConfig = {
      slug: 'my-collection',
      fields: [],
      admin: {
        components: {
          views: {
            grid: {
              path: '/grid',
            } as any,
          },
        },
      },
    }

    warnOnInvalidCustomViews(collection)

    expect(warnSpy).toHaveBeenCalledOnce()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"grid"'))
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"my-collection"'))
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('"Component"'))
  })

  it('should not warn when views is undefined', () => {
    const collection: CollectionConfig = {
      slug: 'my-collection',
      fields: [],
    }

    warnOnInvalidCustomViews(collection)

    expect(warnSpy).not.toHaveBeenCalled()
  })
})
