import type { PayloadRequest } from 'payload'

import { UnauthorizedError } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SanitizedStripePluginConfig } from '../types.js'

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
  access?: ({ req }: { req: PayloadRequest }) => boolean | Promise<boolean>
} = {}): SanitizedStripePluginConfig => ({
  rest:
    access === undefined
      ? { allowedMethods: ['subscriptions.list'] }
      : { access, allowedMethods: ['subscriptions.list'] },
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

  // Mutation caught: replacing the anonymous guard with a generic failure or forwarding anonymous requests.
  it('should return 401 for an anonymous request without invoking Stripe', async () => {
    const req = createRequest({ user: null })

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

    expect(response.status).toBe(401)
    expect(mocks.canAccessAdmin).not.toHaveBeenCalled()
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  // Mutation caught: omitting the default admin access check for an authenticated request.
  it('should return 403 when default admin access denies the user', async () => {
    mocks.canAccessAdmin.mockRejectedValue(new UnauthorizedError())
    const req = createRequest()

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

    expect(response.status).toBe(403)
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  // Mutation caught: rejecting every configured method or bypassing the default admin authorization on success.
  it('should invoke an exactly listed method for an authenticated admin user', async () => {
    const req = createRequest({ stripeArgs: [{ limit: 10 }] })

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

    expect(response.status).toBe(200)
    expect(mocks.canAccessAdmin).toHaveBeenCalledWith({ req })
    expect(mocks.stripeProxy).toHaveBeenCalledWith({
      stripeArgs: [{ limit: 10 }],
      stripeMethod: 'subscriptions.list',
      stripeSecretKey: 'sk_test_example',
    })
  })

  // Mutation caught: always running the default admin check instead of a configured custom access callback.
  it('should use a custom access callback instead of the default admin check', async () => {
    const access = vi.fn(async () => true)
    const req = createRequest()

    const response = await stripeREST({ pluginConfig: createPluginConfig({ access }), req })

    expect(response.status).toBe(200)
    expect(access).toHaveBeenCalledWith({ req })
    expect(mocks.canAccessAdmin).not.toHaveBeenCalled()
    expect(mocks.stripeProxy).toHaveBeenCalledTimes(1)
  })

  // Mutation caught: ignoring a false result from a custom access callback.
  it('should return 403 when custom access denies the authenticated user', async () => {
    const access = vi.fn(async () => false)
    const req = createRequest()

    const response = await stripeREST({ pluginConfig: createPluginConfig({ access }), req })

    expect(response.status).toBe(403)
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  // Mutation caught: forwarding an unlisted Stripe method to the proxy instead of rejecting it locally.
  it('should return a generic invalid-request response for an unlisted method without invoking Stripe', async () => {
    const req = createRequest({ stripeMethod: 'customers.list' })

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: 'Invalid request' })
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  // Mutation caught: treating an empty allowlist as a wildcard.
  it('should return a generic invalid-request response for an empty allowlist', async () => {
    const req = createRequest()
    const pluginConfig = {
      ...createPluginConfig(),
      rest: { allowedMethods: [] },
    }

    const response = await stripeREST({ pluginConfig, req })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: 'Invalid request' })
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  it.each([[''], ['   '], [123], [null]])(
    // Mutation caught: passing malformed method input through to Stripe.
    'should return 400 for malformed method %s without invoking Stripe',
    async (stripeMethod) => {
      const req = createRequest({ stripeMethod })

      const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

      expect(response.status).toBe(400)
      expect(mocks.stripeProxy).not.toHaveBeenCalled()
    },
  )

  // Mutation caught: forwarding non-array Stripe arguments to the Stripe proxy.
  it('should return 400 for non-array Stripe arguments without invoking Stripe', async () => {
    const req = createRequest({ stripeArgs: { limit: 10 } })

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: 'Invalid request' })
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  // Mutation caught: leaking request parser errors through the HTTP response.
  it('should return a generic structured 500 when request parsing fails', async () => {
    const parserError = new Error('sensitive parser detail')
    const req = createRequest()

    mocks.addDataAndFileToRequest.mockRejectedValue(parserError)

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ message: 'Internal server error' })
    expect(loggerError).toHaveBeenCalledWith({
      err: parserError,
      msg: 'An unexpected error occurred in the Stripe plugin REST handler.',
    })
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  // Mutation caught: leaking a custom access callback exception or continuing to Stripe.
  it('should return a generic structured 500 when custom access throws', async () => {
    const accessError = new Error('sensitive custom access detail')
    const access = vi.fn(async () => {
      throw accessError
    })
    const req = createRequest()

    const response = await stripeREST({ pluginConfig: createPluginConfig({ access }), req })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ message: 'Internal server error' })
    expect(loggerError).toHaveBeenCalledWith({
      err: accessError,
      msg: 'An unexpected error occurred in the Stripe plugin REST handler.',
    })
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })

  // Mutation caught: treating an unexpected default admin access exception as a 403 or leaking it.
  it('should return a generic structured 500 when default admin access throws unexpectedly', async () => {
    const accessError = new Error('sensitive admin access detail')
    const req = createRequest()

    mocks.canAccessAdmin.mockRejectedValue(accessError)

    const response = await stripeREST({ pluginConfig: createPluginConfig(), req })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ message: 'Internal server error' })
    expect(loggerError).toHaveBeenCalledWith({
      err: accessError,
      msg: 'An unexpected error occurred in the Stripe plugin REST handler.',
    })
    expect(mocks.stripeProxy).not.toHaveBeenCalled()
  })
})
