import { describe, expect, expectTypeOf, it, vi } from 'vitest'

import type { PaymentAdapter } from '../../types/index.js'

import { createOrdersCollection } from './createOrdersCollection.js'

describe('createOrdersCollection', () => {
  it('should not add a second payment reference to orders', () => {
    const adminOnlyFieldAccess = vi.fn()
    const collection = createOrdersCollection({
      access: {
        adminOnlyFieldAccess,
        isAdmin: vi.fn(),
        isDocumentOwner: vi.fn(),
      },
    })
    expect(
      collection.fields.some((field) => 'name' in field && field.name === 'paymentReference'),
    ).toBe(false)
  })

  it('should require adapters to return the public transaction ID', () => {
    type ConfirmationResult = Awaited<ReturnType<PaymentAdapter['confirmOrder']>>

    expectTypeOf<ConfirmationResult>().toMatchTypeOf<{
      message: string
      orderID: string | number
      transactionID: string | number
    }>()
  })
})
