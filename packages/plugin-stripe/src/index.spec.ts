import type { Config } from 'payload'

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  stripeREST: vi.fn(),
}))

vi.mock('./routes/rest.js', () => ({
  stripeREST: mocks.stripeREST,
}))

import { stripePlugin } from './index.js'

const createBaseConfig = (): Config => ({ collections: [] })

describe('stripePlugin REST endpoint registration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.stripeREST.mockResolvedValue(Response.json({}, { status: 405 }))
  })

  // Mutation caught: restoring the legacy `rest: true` configuration without an explicit allowlist.
  it('should reject the legacy true configuration', () => {
    expect(() =>
      stripePlugin({
        // @ts-expect-error -- `true` is intentionally rejected in every supported release line.
        rest: true,
        stripeSecretKey: 'sk_test_example',
      })(createBaseConfig()),
    ).toThrow('non-empty allowedMethods')

    expect(mocks.stripeREST).not.toHaveBeenCalled()
  })

  // Mutation caught: only registering the endpoint for the legacy boolean form.
  it('should register an object-configured endpoint with its exact allowlist', async () => {
    const transformedConfig = stripePlugin({
      rest: { allowedMethods: ['customers.list'] },
      stripeSecretKey: 'sk_test_example',
    })(createBaseConfig())
    const endpoint = transformedConfig.endpoints?.find(({ path }) => path === '/stripe/rest')
    const req = {} as Parameters<NonNullable<typeof endpoint>['handler']>[0]

    await endpoint?.handler(req)

    expect(endpoint).toMatchObject({ method: 'post', path: '/stripe/rest' })
    expect(mocks.stripeREST).toHaveBeenCalledWith({
      pluginConfig: expect.objectContaining({
        rest: { allowedMethods: ['customers.list'] },
      }),
      req,
    })
  })

  // Mutation caught: registering the REST endpoint when its configuration is omitted.
  it('should not register the REST endpoint when the option is absent', () => {
    const transformedConfig = stripePlugin({
      stripeSecretKey: 'sk_test_example',
    })(createBaseConfig())

    expect(transformedConfig.endpoints?.filter(({ path }) => path === '/stripe/rest')).toEqual([])
  })

  // Mutation caught: removing fail-closed runtime handling for untyped configurations.
  it('should treat false from an untyped configuration as disabled', () => {
    const transformedConfig = stripePlugin({
      // @ts-expect-error -- omission is the supported way to disable the endpoint.
      rest: false,
      stripeSecretKey: 'sk_test_example',
    })(createBaseConfig())

    expect(transformedConfig.endpoints?.filter(({ path }) => path === '/stripe/rest')).toEqual([])
  })
})

describe('stripePlugin managed fields', () => {
  it('should prevent API writes to Stripe-managed fields', () => {
    const transformedConfig = stripePlugin({
      stripeSecretKey: 'sk_test_example',
      sync: [
        {
          collection: 'products',
          fields: [],
          stripeResourceType: 'products',
          stripeResourceTypeSingular: 'product',
        },
      ],
    })({
      collections: [
        {
          fields: [],
          slug: 'products',
        },
      ],
    })
    const fields = transformedConfig.collections?.[0]?.fields ?? []
    const stripeIDField = fields.find((field) => 'name' in field && field.name === 'stripeID')
    const skipSyncField = fields.find((field) => 'name' in field && field.name === 'skipSync')

    expect(stripeIDField).toMatchObject({
      access: { create: expect.any(Function), update: expect.any(Function) },
    })
    expect(skipSyncField).toMatchObject({
      access: { create: expect.any(Function), update: expect.any(Function) },
    })
    expect(stripeIDField?.access?.create?.({} as never)).toBe(false)
    expect(stripeIDField?.access?.update?.({} as never)).toBe(false)
    expect(skipSyncField?.access?.create?.({} as never)).toBe(false)
    expect(skipSyncField?.access?.update?.({} as never)).toBe(false)
  })
})
