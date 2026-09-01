import type { CollectionConfig } from './types.js'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { canAccessAdmin } from '../../utilities/canAccessAdmin.js'
import type { FieldAccess } from '../../fields/config/types.js'
import { sanitizeCollection, warnOnInvalidCustomViews } from './sanitize.js'

describe('API key fields', () => {
  const getAPIKeyFields = ({
    access,
    fields = [],
  }: {
    access?: CollectionConfig['access']
    fields?: CollectionConfig['fields']
  } = {}) => {
    const config = {
      admin: {
        user: 'users',
      },
      collections: [],
      globals: [],
    } as any
    const collection: CollectionConfig = {
      slug: 'users',
      access,
      auth: {
        useAPIKey: true,
      },
      fields,
    }
    const sanitizedCollection = sanitizeCollection(config, collection)
    const apiKey = sanitizedCollection.fields.find(
      (field) => 'name' in field && field.name === 'apiKey',
    )
    const enableAPIKey = sanitizedCollection.fields.find(
      (field) => 'name' in field && field.name === 'enableAPIKey',
    )

    return { apiKey, config, enableAPIKey, sanitizedCollection }
  }

  it('should only allow an authenticated user to read their own API key', async () => {
    const { apiKey, sanitizedCollection } = getAPIKeyFields()
    const read = apiKey && 'access' in apiKey ? apiKey.access?.read : undefined
    const args = {
      collection: sanitizedCollection,
      id: 'user-1',
      req: {
        user: {
          collection: 'users',
          id: 'user-1',
        },
      },
    } as any

    expect(await read?.(args)).toBe(true)
    expect(
      await read?.({
        ...args,
        id: 1,
        req: { user: { collection: 'users', id: '1' } },
      }),
    ).toBe(true)
    expect(await read?.({ ...args, id: 'user-2' })).toBe(false)
    expect(
      await read?.({
        ...args,
        req: { user: { collection: 'customers', id: 'user-1' } },
      }),
    ).toBe(false)
    expect(await read?.({ ...args, req: { user: null } })).toBe(false)
  })

  it('should only allow authenticated Admin Panel users to read API key status', async () => {
    const { config, enableAPIKey, sanitizedCollection } = getAPIKeyFields({
      access: {
        admin: async ({ req }) => req.user?.role === 'admin',
      },
    })
    const read = enableAPIKey && 'access' in enableAPIKey ? enableAPIKey.access?.read : undefined
    const req = {
      payload: {
        collections: {
          users: {
            config: sanitizedCollection,
          },
        },
        config,
      },
      user: {
        collection: 'users',
        id: 'user-1',
        role: 'admin',
      },
    } as any

    expect(await read?.({ collection: sanitizedCollection, id: 'user-1', req })).toBe(true)

    req.user.role = 'editor'
    expect(await read?.({ collection: sanitizedCollection, id: 'user-1', req })).toBe(false)

    req.user = null
    expect(await read?.({ collection: sanitizedCollection, id: 'user-1', req })).toBe(false)
  })

  it('should allow collection fields to make API keys readable by all Admin users', async () => {
    const apiKeyRead: FieldAccess = ({ req: { payload, user } }) =>
      Boolean(user) && user.collection === payload.config.admin.user
    const enableAPIKeyRead = () => true
    const { apiKey, config, enableAPIKey, sanitizedCollection } = getAPIKeyFields({
      fields: [
        {
          name: 'apiKey',
          type: 'text',
          access: {
            read: apiKeyRead,
          },
        },
        {
          name: 'enableAPIKey',
          type: 'checkbox',
          access: {
            read: enableAPIKeyRead,
          },
        },
      ],
    })

    expect(apiKey && 'access' in apiKey && apiKey.access?.read).toBe(apiKeyRead)
    expect(enableAPIKey && 'access' in enableAPIKey && enableAPIKey.access?.read).toBe(
      enableAPIKeyRead,
    )
    expect(
      await (apiKey && 'access' in apiKey
        ? apiKey.access?.read?.({
            collection: sanitizedCollection,
            id: 'user-1',
            req: {
              payload: { config },
              user: {
                collection: 'users',
                id: 'user-2',
              },
            },
          } as any)
        : undefined),
    ).toBe(true)
    expect(
      await (apiKey && 'access' in apiKey
        ? apiKey.access?.read?.({
            collection: sanitizedCollection,
            id: 'user-1',
            req: { payload: { config }, user: null },
          } as any)
        : undefined),
    ).toBe(false)
    expect(
      await (enableAPIKey && 'access' in enableAPIKey
        ? enableAPIKey.access?.read?.({ collection: sanitizedCollection } as any)
        : undefined),
    ).toBe(true)
  })
})

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
    const accessResult = await result.access.read({ req, slug: 'posts' })

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
    expect(collectionAccess).toHaveBeenCalledWith({
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
    const accessResult = await result.access.update({ req, slug: 'posts' })

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

    expect(await result.access.update({ req, slug: 'posts' })).toBe(true)
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

    expect(await result.access.read({ req, slug: 'posts' })).toBe(false)
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

    expect(await result.access.read({ req, slug: 'posts' })).toBe(false)
  })

  it('should combine base and collection admin access', async () => {
    const adminAccess = vi.fn(() => true)
    const baseAccess = vi.fn(() => true)
    const config = {
      baseAccess: {
        collections: {
          admin: baseAccess,
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

    expect(await result.access.admin({ req, slug: 'users' })).toBe(true)
    expect(baseAccess).toHaveBeenCalledWith({ req, slug: 'users' })
    expect(adminAccess).toHaveBeenCalledWith({ req, slug: 'users' })
  })

  it('should deny admin access before collection admin access runs', async () => {
    const adminAccess = vi.fn(() => true)
    const baseAccess = vi.fn(() => false)
    const config = {
      admin: {
        user: 'users',
      },
      baseAccess: {
        collections: {
          admin: baseAccess,
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
    const sanitizedCollection = sanitizeCollection(config, collection)
    const req = {
      payload: {
        collections: {
          users: {
            config: sanitizedCollection,
          },
        },
        config,
      },
      user: {
        collection: 'users',
        id: 'user-1',
      },
    } as any

    await expect(canAccessAdmin({ req })).rejects.toThrow()
    expect(baseAccess).toHaveBeenCalledWith({ req, slug: 'users' })
    expect(adminAccess).not.toHaveBeenCalled()
  })

  it('should not grant admin access to a different auth collection', async () => {
    const config = {
      admin: {
        user: 'users',
      },
      baseAccess: {
        collections: {
          admin: () => true,
        },
      },
      collections: [],
      globals: [],
    } as any
    const collection: CollectionConfig = {
      slug: 'customers',
      auth: true,
      fields: [],
    }
    const req = {
      payload: {
        config,
      },
      user: {
        collection: 'customers',
        id: 'customer-1',
      },
    } as any

    const result = sanitizeCollection(config, collection)

    expect(await result.access.admin({ req, slug: 'customers' })).toBe(false)
  })

  it('should reject query constraints for collection admin operations', async () => {
    const config = {
      baseAccess: {
        collections: {
          admin: () => ({
            role: {
              equals: 'admin',
            },
          }),
        },
      },
      collections: [],
      globals: [],
    } as any
    const collection: CollectionConfig = {
      slug: 'users',
      auth: true,
      fields: [],
    }
    const req = {
      payload: {
        config,
      },
    } as any

    const result = sanitizeCollection(config, collection)

    await expect(result.access.admin({ req, slug: 'users' })).rejects.toThrow(
      'baseAccess must return a boolean for collection admin operations.',
    )
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

    await expect(result.access.create({ req, slug: 'posts' })).rejects.toThrow(
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
