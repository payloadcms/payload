import type { Config } from 'payload'

import { describe, expect, it } from 'vitest'

import type { StripePluginConfig } from './types.js'

import { stripePlugin } from './index.js'

const createBaseConfig = (): Config => ({ collections: [] })

const getStripeRESTEndpoints = async (pluginConfig: StripePluginConfig) => {
  const transformedConfig = await stripePlugin(pluginConfig)(createBaseConfig())

  return transformedConfig.endpoints?.filter(({ path }) => path === '/stripe/rest') ?? []
}

describe('stripePlugin REST endpoint registration', () => {
  it('should not register the REST endpoint when the option is absent', async () => {
    const endpoints = await getStripeRESTEndpoints({ stripeSecretKey: 'sk_test_example' })

    expect(endpoints).toHaveLength(0)
  })

  it('should treat false from an untyped configuration as disabled', async () => {
    const endpoints = await getStripeRESTEndpoints({
      // @ts-expect-error -- omission is the supported way to disable the endpoint.
      rest: false,
      stripeSecretKey: 'sk_test_example',
    })

    expect(endpoints).toHaveLength(0)
  })

  it('should register exactly one POST endpoint for a valid REST configuration', async () => {
    const endpoints = await getStripeRESTEndpoints({
      rest: { allowedMethods: ['subscriptions.list'] },
      stripeSecretKey: 'sk_test_example',
    })

    expect(endpoints).toHaveLength(1)
    expect(endpoints[0]?.method).toBe('post')
  })

  it.each([
    ['the legacy boolean form', true],
    ['an empty allowlist', { allowedMethods: [] }],
    ['a wildcard method', { allowedMethods: ['subscriptions.*'] }],
    ['a non-string method', { allowedMethods: [123] }],
  ])('should reject %s during plugin transformation', async (_description, rest) => {
    const invalidConfig = {
      rest,
      stripeSecretKey: 'sk_test_example',
    } as unknown as StripePluginConfig

    expect(() => stripePlugin(invalidConfig)(createBaseConfig())).toThrow(
      'The Stripe REST endpoint now requires an object with a non-empty allowedMethods array',
    )
  })
})
