import type { Config } from '../../config/types.js'
import type { Field } from '../../fields/config/types.js'
import type { CollectionConfig } from './types.js'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { sanitizeCollection, warnOnInvalidCustomViews } from './sanitize.js'

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

describe('required validation warnings', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('required validation after auth-field merging', () => {
    it('should warn when an auth override inherits required from its base field', async () => {
      const customValidate = () => true as const
      const collection = await sanitizeCollection({ collections: [] } as Config, {
        slug: 'users',
        auth: true,
        fields: [{ name: 'email', type: 'email', validate: customValidate }],
      })
      const field = collection.fields.find((field) => 'name' in field && field.name === 'email')

      expect(field).toMatchObject({ required: true, validate: customValidate })
      expect(console.warn).toHaveBeenCalledTimes(1)
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('users.email'))
    })

    it('should not warn for built-in auth validation', async () => {
      await sanitizeCollection({ collections: [] } as Config, {
        slug: 'users',
        auth: true,
        fields: [],
      })

      expect(console.warn).not.toHaveBeenCalled()
    })

    it('should warn only once for an explicitly required auth override', async () => {
      await sanitizeCollection({ collections: [] } as Config, {
        slug: 'users',
        auth: true,
        fields: [{ name: 'email', type: 'email', required: true, validate: () => true }],
      })

      expect(console.warn).toHaveBeenCalledTimes(1)
    })

    it('should not warn for an explicitly optional auth override', async () => {
      await sanitizeCollection({ collections: [] } as Config, {
        slug: 'users',
        auth: true,
        fields: [{ name: 'email', type: 'email', required: false, validate: () => true }],
      })

      expect(console.warn).not.toHaveBeenCalled()
    })
  })

  describe('auth-field validation scope', () => {
    it('should not install additional validators on built-in auth fields', async () => {
      const collection = await sanitizeCollection({ collections: [] } as Config, {
        slug: 'users',
        auth: true,
        fields: [],
      })
      const field = collection.fields.find((field) => 'name' in field && field.name === 'hash')

      expect(field).toBeDefined()
      expect(field).not.toHaveProperty('validate')
    })
  })

  describe('auth warnings inside layout fields', () => {
    it.each(['row', 'collapsible', 'tabs'] as const)(
      'should warn for custom required fields inside %s',
      async (type) => {
        const fields: Field[] = [
          { name: 'title', type: 'text', required: true, validate: () => true },
        ]
        const layout: Field =
          type === 'tabs'
            ? { type, tabs: [{ label: 'Details', fields }] }
            : type === 'collapsible'
              ? { type, label: 'Details', fields }
              : { type, fields }

        await sanitizeCollection({ collections: [] } as Config, {
          slug: 'users',
          auth: true,
          fields: [layout],
        })

        expect(console.warn).toHaveBeenCalledTimes(1)
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('title'))
      },
    )

    it('should warn when username inherits required from its base field', async () => {
      await sanitizeCollection({ collections: [] } as Config, {
        slug: 'users',
        auth: { loginWithUsername: true },
        fields: [{ name: 'username', type: 'text', validate: () => true }],
      })

      expect(console.warn).toHaveBeenCalledTimes(1)
      expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('users.username'))
    })
  })
})
