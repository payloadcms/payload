import type { StripePluginConfig } from '@payloadcms/plugin-stripe/types'

import { expect, test } from 'tstyche'

test('should reject the legacy true REST configuration type', () => {
  // Mutation caught: restoring `true` to the public `rest` type without an explicit allowlist.
  expect({
    rest: true as const,
    stripeSecretKey: 'sk_test_example',
  }).type.not.toBeAssignableTo<StripePluginConfig>()
})

test('should reject false as a REST configuration type', () => {
  // Mutation caught: restoring `false` to the public `rest` type instead of using omission to disable it.
  expect({
    rest: false as const,
    stripeSecretKey: 'sk_test_example',
  }).type.not.toBeAssignableTo<StripePluginConfig>()
})

test('should allow the REST configuration to be omitted', () => {
  expect({
    stripeSecretKey: 'sk_test_example',
  }).type.toBeAssignableTo<StripePluginConfig>()
})
