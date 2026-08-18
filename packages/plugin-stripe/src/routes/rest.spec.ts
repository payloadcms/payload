import type { PayloadRequest } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockAddDataAndFileToRequest, mockStripeProxy } = vi.hoisted(() => ({
  mockAddDataAndFileToRequest: vi.fn(async (_req?: unknown) => undefined),
  mockStripeProxy: vi.fn(),
}))

vi.mock('payload', () => {
  class Forbidden extends Error {
    status = 403

    constructor(_t?: unknown) {
      super('Not allowed to perform this action.')
    }
  }

  return {
    addDataAndFileToRequest: mockAddDataAndFileToRequest,
    Forbidden,
  }
})

vi.mock('../utilities/stripeProxy.js', () => ({
  stripeProxy: mockStripeProxy,
}))

import { stripeREST } from './rest.js'

const createRequest = ({ user }: { user?: { id: string } } = {}) => {
  const logger = { error: vi.fn() }
  const req = {
    data: {
      stripeArgs: [{ limit: 2 }],
      stripeMethod: 'subscriptions.list',
    },
    payload: { logger },
    t: vi.fn(),
    user,
  } as unknown as PayloadRequest

  return { logger, req }
}

const pluginConfig = {
  stripeSecretKey: 'sk_test_example',
}

describe('stripeREST', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return the Stripe proxy response for an authenticated request', async () => {
    mockStripeProxy.mockResolvedValue({ data: { id: 'sub_123' }, status: 200 })
    const { logger, req } = createRequest({ user: { id: 'user_123' } })

    const response = await stripeREST({ pluginConfig, req })

    expect(mockAddDataAndFileToRequest).toHaveBeenCalledWith(req)
    expect(mockStripeProxy).toHaveBeenCalledWith({
      stripeArgs: [{ limit: 2 }],
      stripeMethod: 'subscriptions.list',
      stripeSecretKey: 'sk_test_example',
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ data: { id: 'sub_123' }, status: 200 })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('should preserve the forbidden status for an unauthenticated request', async () => {
    const { logger, req } = createRequest()

    const response = await stripeREST({ pluginConfig, req })

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({
      message: 'Not allowed to perform this action.',
    })
    expect(mockStripeProxy).not.toHaveBeenCalled()
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('should log unexpected proxy errors and return a 500 response', async () => {
    const proxyError = new Error('Stripe is unavailable')

    mockStripeProxy.mockRejectedValue(proxyError)
    const { logger, req } = createRequest({ user: { id: 'user_123' } })

    const response = await stripeREST({ pluginConfig, req })

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({
      message: 'An error has occurred in the Stripe plugin REST handler.',
    })
    expect(logger.error).toHaveBeenCalledWith({
      err: proxyError,
      msg: 'An error has occurred in the Stripe plugin REST handler.',
    })
  })
})
