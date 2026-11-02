import { describe, expect, it, vi } from 'vitest'

import { sanitizeStripeRESTConfig } from './sanitizeStripeRESTConfig.js'

describe('sanitizeStripeRESTConfig', () => {
  it('should disable the REST endpoint when configuration is absent', () => {
    expect(sanitizeStripeRESTConfig({ rest: undefined })).toBeUndefined()
  })

  it('should treat false from an untyped configuration as disabled', () => {
    expect(sanitizeStripeRESTConfig({ rest: false })).toBeUndefined()
  })

  it('should return a new configuration with exact, de-duplicated, frozen methods', () => {
    const access = vi.fn(() => true)
    const rest = {
      access,
      allowedMethods: ['subscriptions.list', ' paymentIntents.retrieve ', 'subscriptions.list'],
    } as const

    const sanitized = sanitizeStripeRESTConfig({ rest })

    expect(sanitized).not.toBe(rest)
    expect(sanitized).toEqual({
      access,
      allowedMethods: ['subscriptions.list', ' paymentIntents.retrieve '],
    })
    expect(Object.isFrozen(sanitized.allowedMethods)).toBe(true)
  })

  it.each([
    ['the legacy boolean form', true],
    ['an array', [{ allowedMethods: ['subscriptions.list'] }]],
    ['a missing allowlist', {}],
    ['a non-array allowlist', { allowedMethods: 'subscriptions.list' }],
    ['an empty allowlist', { allowedMethods: [] }],
    ['an empty method', { allowedMethods: [''] }],
    ['a whitespace-only method', { allowedMethods: ['   '] }],
    ['a non-string method', { allowedMethods: [123] }],
    ['a wildcard method', { allowedMethods: ['subscriptions.*'] }],
    ['a non-function access value', { access: true, allowedMethods: ['subscriptions.list'] }],
  ])('should reject %s', (_description, rest) => {
    expect(() => sanitizeStripeRESTConfig({ rest })).toThrow(
      'The Stripe REST endpoint now requires an object with a non-empty allowedMethods array',
    )
  })
})
