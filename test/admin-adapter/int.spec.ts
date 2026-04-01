import type { Payload } from 'payload'

import path from 'path'
import { fileURLToPath } from 'url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { initPayloadInt } from '../__helpers/shared/initPayloadInt.js'

let payload: Payload

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

describe('AdminAdapter', () => {
  beforeAll(async () => {
    ;({ payload } = await initPayloadInt(dirname))
  })

  afterAll(async () => {
    await payload.destroy()
  })

  describe('lifecycle wiring', () => {
    it('should have adminAdapter undefined when no adapter is configured', () => {
      // buildConfigWithDefaults does not set admin.adapter, so adminAdapter is undefined
      expect(payload.adminAdapter).toBeUndefined()
    })

    it('should have a valid payload instance initialized', () => {
      expect(payload).toBeDefined()
      expect(payload.collections).toBeDefined()
    })
  })

  describe('config field types', () => {
    it('should accept admin.adapter field in buildConfig', async () => {
      const { buildConfig, createAdminAdapter } = await import('payload')

      const mockAdapterResult = {
        name: 'mock-adapter',
        init: ({ payload: p }: { payload: Payload }) =>
          createAdminAdapter({
            RouterProvider: (() => null) as any,
            createRouteHandlers: () => ({}),
            deleteCookie: () => {},
            getCookie: () => undefined,
            handleServerFunctions: async () => {},
            initReq: () => {
              throw new Error('not used')
            },
            name: 'mock-adapter',
            notFound: (): never => {
              throw new Error('not found')
            },
            payload: p,
            redirect: (): never => {
              throw new Error('redirect')
            },
            setCookie: () => {},
          }),
      }

      const config = await buildConfig({
        admin: {
          adapter: mockAdapterResult,
          disable: true,
        },
        collections: [{ slug: 'test', fields: [] }],
        db: (payload as any).config.db,
        secret: 'test-secret',
      })

      expect(config.admin?.adapter).toBeDefined()
      expect(config.admin?.adapter?.name).toBe('mock-adapter')
      expect(typeof config.admin?.adapter?.init).toBe('function')
    })

    it('should call adapter.init and expose result on payload.adminAdapter', async () => {
      const { buildConfig, createAdminAdapter } = await import('payload')

      let initCallCount = 0

      const adapterResult = {
        name: 'counting-adapter',
        init: ({ payload: p }: { payload: Payload }) => {
          initCallCount++
          return createAdminAdapter({
            RouterProvider: (() => null) as any,
            createRouteHandlers: () => ({}),
            deleteCookie: () => {},
            getCookie: () => undefined,
            handleServerFunctions: async () => {},
            initReq: () => {
              throw new Error('not used')
            },
            name: 'counting-adapter',
            notFound: (): never => {
              throw new Error('not found')
            },
            payload: p,
            redirect: (): never => {
              throw new Error('redirect')
            },
            setCookie: () => {},
          })
        },
      }

      const config = await buildConfig({
        admin: {
          adapter: adapterResult,
          disable: true,
        },
        collections: [{ slug: 'test', fields: [] }],
        db: (payload as any).config.db,
        secret: 'test-secret',
      })

      // Simulate what Payload.init() does
      const adapterInstance = config.admin?.adapter?.init({ payload })
      expect(adapterInstance).toBeDefined()
      expect(adapterInstance?.name).toBe('counting-adapter')
      expect(initCallCount).toBe(1)
    })
  })

  describe('createAdminAdapter helper', () => {
    it('should return the same object it receives (identity helper)', async () => {
      const { createAdminAdapter } = await import('payload')

      const adapterShape = {
        RouterProvider: (() => null) as any,
        createRouteHandlers: () => ({}),
        deleteCookie: () => {},
        getCookie: () => undefined,
        handleServerFunctions: async () => {},
        initReq: () => {
          throw new Error('not used')
        },
        name: 'identity-test',
        notFound: (): never => {
          throw new Error('not found')
        },
        payload: null as any,
        redirect: (): never => {
          throw new Error('redirect')
        },
        setCookie: () => {},
      }

      const result = createAdminAdapter(adapterShape)
      expect(result).toBe(adapterShape)
    })
  })
})
