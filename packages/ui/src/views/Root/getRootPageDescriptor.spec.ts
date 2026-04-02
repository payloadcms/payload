import type { InitReqResult } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getRootPageDescriptor } from './getRootPageDescriptor'

const mockGetRouteData = vi.fn()
const mockGetClientConfig = vi.fn()
const mockGetVisibleEntities = vi.fn()
const mockGetPreferences = vi.fn()

vi.mock('payload/shared', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload/shared')>()

  return {
    ...actual,
    applyLocaleFiltering: vi.fn(async () => {}),
  }
})

vi.mock('../../utilities/getClientConfig.js', () => ({
  getClientConfig: (...args: unknown[]) => mockGetClientConfig(...args),
}))

vi.mock('../../utilities/getPreferences.js', () => ({
  getPreferences: (...args: unknown[]) => mockGetPreferences(...args),
}))

vi.mock('../../utilities/getVisibleEntities.js', () => ({
  getVisibleEntities: (...args: unknown[]) => mockGetVisibleEntities(...args),
}))

vi.mock('./getRouteData.js', () => ({
  getRouteData: (...args: unknown[]) => mockGetRouteData(...args),
}))

const createInitPageResult = (args?: {
  collections?: Array<{ admin?: { hidden?: boolean }; slug: string }>
  globals?: Array<{ admin?: { hidden?: boolean }; slug: string }>
  user?: Record<string, unknown>
}): InitReqResult => {
  const config = {
    admin: {
      components: {
        actions: [],
      },
      routes: {
        createFirstUser: '/create-first-user',
      },
      user: 'users',
    },
    collections: args?.collections ?? [],
    globals: args?.globals ?? [],
    routes: {
      admin: '/admin',
    },
  }

  return {
    cookies: new Map(),
    locale: undefined,
    permissions: {
      canAccessAdmin: true,
    },
    req: {
      i18n: {
        language: 'en',
        translations: {},
      },
      payload: {
        config,
        db: {
          findOne: vi.fn(),
        },
      },
      user: args?.user ?? { id: '1' },
    },
  } as unknown as InitReqResult
}

describe('getRootPageDescriptor', () => {
  beforeEach(() => {
    mockGetClientConfig.mockReset()
    mockGetPreferences.mockReset()
    mockGetRouteData.mockReset()
    mockGetVisibleEntities.mockReset()

    mockGetClientConfig.mockReturnValue({
      routes: {
        admin: '/admin',
      },
    })

    mockGetVisibleEntities.mockReturnValue({
      collections: ['posts'],
      globals: ['settings'],
    })
  })

  it('should return a page descriptor for the admin dashboard route', async () => {
    mockGetRouteData.mockReturnValue({
      browseByFolderSlugs: [],
      DefaultView: {
        Component: () => null,
      },
      documentSubViewType: undefined,
      routeParams: {},
      templateClassName: 'dashboard',
      templateType: 'default',
      viewActions: undefined,
      viewType: 'dashboard',
    })

    const result = await getRootPageDescriptor({
      importMap: {} as never,
      initPageResult: createInitPageResult(),
      searchParams: {},
      segments: [],
    })

    expect(result).toEqual({
      descriptor: {
        browseByFolderSlugs: [],
        clientConfig: {
          routes: {
            admin: '/admin',
          },
        },
        collectionConfig: undefined,
        DefaultView: {
          Component: expect.any(Function),
        },
        documentSubViewType: undefined,
        globalConfig: undefined,
        routeParams: {},
        templateClassName: 'dashboard',
        templateType: 'default',
        viewActions: undefined,
        viewType: 'dashboard',
        visibleEntities: {
          collections: ['posts'],
          globals: ['settings'],
        },
      },
      type: 'page',
    })
  })

  it('should return not-found for unknown collection routes', async () => {
    const result = await getRootPageDescriptor({
      importMap: {} as never,
      initPageResult: createInitPageResult({
        collections: [],
      }),
      searchParams: {},
      segments: ['collections', 'missing'],
    })

    expect(result).toEqual({
      type: 'not-found',
    })
    expect(mockGetRouteData).not.toHaveBeenCalled()
  })

  it('should redirect bare collection routes to the admin root when no custom view exists', async () => {
    const result = await getRootPageDescriptor({
      importMap: {} as never,
      initPageResult: createInitPageResult({
        collections: [],
      }),
      searchParams: {},
      segments: ['collections'],
    })

    expect(result).toEqual({
      type: 'redirect',
      url: '/admin',
    })
    expect(mockGetRouteData).not.toHaveBeenCalled()
  })
})
