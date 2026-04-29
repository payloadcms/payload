import type { CollectionConfig } from './types.js'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { warnOnInvalidCustomViews } from './sanitize.js'

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
