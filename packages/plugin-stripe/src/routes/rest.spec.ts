import type { PayloadRequest } from 'payload'

import { UnauthorizedError } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SanitizedStripePluginConfig, StripeRESTAccess } from '../types.js'

const mocks = vi.hoisted(() => ({
  addDataAndFileToRequest: vi.fn(),
  canAccessAdmin: vi.fn(),
  stripeProxy: vi.fn(),
}))

vi.mock('payload', async (importOriginal) => {
  const payload = await importOriginal<typeof import('payload')>()

  return {
    ...payload,
    addDataAndFileToRequest: mocks.addDataAndFileToRequest,
    canAccessAdmin: mocks.canAccessAdmin,
  }
})

vi.mock('../utilities/stripeProxy.js', () => ({
  stripeProxy: mocks.stripeProxy,
}))

import { stripeREST } from './rest.js'

const loggerError = vi.fn()

const createPluginConfig = ({
  access,
}: {
  access?: StripeRESTAccess
} = {}): SanitizedStripePluginConfig => ({
  rest: {
    access,
    allowedMethods: ['subscriptions.list'],
  },
  stripeSecretKey: 'sk_test_example',
  sync: [],
})

const createRequest = ({
  stripeArgs = [],
  stripeMethod = 'subscriptions.list',
  user = { collection: 'users', id: 'user-1' },
}: {
  stripeArgs?: unknown
  stripeMethod?: unknown
  user?: null | { collection: string; id: string }
} = {}): PayloadRequest =>
  ({
    data: { stripeArgs, stripeMethod },
    payload: {
      logger: { error: loggerError },
    },
    user,
  }) as unknown as PayloadRequest

describe('stripeREST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.addDataAndFileToRequest.mockResolvedValue(undefined)
    mocks.canAccessAdmin.mockResolvedValue(undefined)
    mocks.stripeProxy.mockResolvedValue({ data: { id: 'sub_123' }, status: 200 })
  })

  it('should return 401 for an anonymous request without invoking Stripe', async () => {
    const req = createRequest({ user: null })

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

    expect(response.status).toBe(401)
    expect(mocks.addDataAndFileToRequest).toHaveBeenCalledWith(req)
    expect(mocks.canAccessAdmin).not.toHaveBeenCalled()
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  it('should return 403 when default admin access denies the user', async () => {
    mocks.canAccessAdmin.mockRejectedValue(new UnauthorizedError())
    const req = createRequest()

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

    expect(response.status).toBe(403)
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  it('should return a generic 500 when default admin access throws unexpectedly', async () => {
    const adminAccessError = new Error('sensitive admin access detail')

    mocks.canAccessAdmin.mockRejectedValue(adminAccessError)
    const req = createRequest()

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ message: 'Internal server error' })
    expect(JSON.stringify(body)).not.toContain('sensitive admin access detail')
    expect(loggerError).toHaveBeenCalledWith({
      err: adminAccessError,
      msg: 'An unexpected error occurred in the Stripe plugin REST handler.',
    })
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  it('should invoke an exactly listed method for an admin user', async () => {
    const req = createRequest({ stripeArgs: [{ limit: 10 }] })

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

    expect(response.status).toBe(200)
    expect(mocks.stripeProxy).toHaveBeenCalledWith({
      stripeArgs: [{ limit: 10 }],
      stripeMethod: 'subscriptions.list',
      stripeSecretKey: 'sk_test_example',
    })
  })

  it('should allow a non-admin when an asynchronous custom access callback permits it', async () => {
    const access = vi.fn(async () => true)
    const req = createRequest()

    const response = await stripeREST({ pluginConfig: createPluginConfig({ access }), req })

    expect(response.status).toBe(200)
    expect(access).toHaveBeenCalledWith({ req })
    expect(mocks.canAccessAdmin).not.toHaveBeenCalled()
  })

  it('should return 403 when custom access denies the user', async () => {
    const access = vi.fn(async () => false)
    const req = createRequest()

    const response = await stripeREST({ pluginConfig: createPluginConfig({ access }), req })

    expect(response.status).toBe(403)
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  it('should return a generic 500 when custom access throws', async () => {
    const access = vi.fn(async () => {
      throw new Error('sensitive access detail')
    })
    const req = createRequest()

    const response = await stripeREST({ pluginConfig: createPluginConfig({ access }), req })
    const body = await response.text()

    expect(response.status).toBe(500)
    expect(body).not.toContain('sensitive access detail')
    expect(loggerError).toHaveBeenCalledWith({
      err: expect.any(Error),
      msg: 'An unexpected error occurred in the Stripe plugin REST handler.',
    })
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  it.each(['customers.list', 'subscriptions.cancel', 'subscriptions.*'])(
    'should return 400 for unlisted method %s without invoking Stripe',
    async (stripeMethod) => {
      const req = createRequest({ stripeMethod })

      const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

      expect(response.status).toBe(400)
      expect(mocks.stripeProxy).not.toHaveBeenCalled()
    },
  )

  it.each([[''], ['   '], [123], [null]])(
    'should return 400 for malformed method %s without invoking Stripe',
    async (stripeMethod) => {
      const req = createRequest({ stripeMethod })

      const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

      expect(response.status).toBe(400)
      expect(mocks.stripeProxy).not.toHaveBeenCalled()
    },
  )

  it('should return 400 for a missing method without invoking Stripe', async () => {
    const req = createRequest()

    delete req.data?.stripeMethod

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

    expect(response.status).toBe(400)
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  it('should return 400 for non-array Stripe arguments without invoking Stripe', async () => {
    const req = createRequest({ stripeArgs: { limit: 10 } })

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

    expect(response.status).toBe(400)
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  it('should evaluate access before revealing whether a method is listed', async () => {
    mocks.canAccessAdmin.mockRejectedValue(new UnauthorizedError())
    const req = createRequest({ stripeMethod: 'customers.delete' })

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

    expect(response.status).toBe(403)
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  it('should preserve the Stripe proxy response status and body after all guards pass', async () => {
    mocks.stripeProxy.mockResolvedValue({ message: 'Stripe request failed', status: 404 })
    const req = createRequest()

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

    expect(response.status).toBe(404)
    expect(await response.json()).toEqual({ message: 'Stripe request failed', status: 404 })
  })

  it('should return a generic 500 when request parsing fails', async () => {
    mocks.addDataAndFileToRequest.mockRejectedValue(new Error('sensitive parser detail'))
    const req = createRequest()

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })
    const body = await response.text()

    expect(response.status).toBe(500)
    expect(body).not.toContain('sensitive parser detail')
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })
})
