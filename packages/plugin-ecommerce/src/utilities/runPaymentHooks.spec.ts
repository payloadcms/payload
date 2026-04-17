import { describe, expect, it, vi } from 'vitest'

import type {
  AfterConfirmOrderHook,
  Adjustment,
  BeforeConfirmOrderHook,
  BeforeInitiatePaymentHook,
} from '../types/index.js'

import {
  runAfterConfirmOrderHooks,
  runBeforeConfirmOrderHooks,
  runBeforeInitiatePaymentHooks,
} from './runPaymentHooks.js'

const createMockInitiateContext = (overrides = {}) => ({
  adjustments: [] as Adjustment[],
  cart: {
    id: 'cart-1',
    items: [{ id: 'item-1', product: 'prod-1', quantity: 1 }],
    subtotal: 1000,
  },
  currency: 'USD',
  currenciesConfig: {
    defaultCurrency: 'USD',
    supportedCurrencies: [{ code: 'USD', decimals: 2, label: 'US Dollar', symbol: '$' }],
  },
  customerEmail: 'test@example.com',
  req: {} as any,
  subtotal: 1000,
  ...overrides,
})

describe('runBeforeInitiatePaymentHooks', () => {
  it('should return empty array when no hooks are provided', async () => {
    const context = createMockInitiateContext()
    const result = await runBeforeInitiatePaymentHooks([], context)
    expect(result).toEqual([])
  })

  it('should accumulate adjustments from a single hook', async () => {
    const taxHook: BeforeInitiatePaymentHook = () => [
      { amount: 100, label: 'Sales Tax', type: 'tax' },
    ]

    const context = createMockInitiateContext()
    const result = await runBeforeInitiatePaymentHooks([taxHook], context)

    expect(result).toEqual([{ amount: 100, label: 'Sales Tax', type: 'tax' }])
  })

  it('should accumulate adjustments from multiple hooks', async () => {
    const taxHook: BeforeInitiatePaymentHook = () => [
      { amount: 100, label: 'Sales Tax', type: 'tax' },
    ]

    const shippingHook: BeforeInitiatePaymentHook = () => [
      { amount: 500, label: 'Standard Shipping', type: 'shipping' },
    ]

    const context = createMockInitiateContext()
    const result = await runBeforeInitiatePaymentHooks([taxHook, shippingHook], context)

    expect(result).toEqual([
      { amount: 100, label: 'Sales Tax', type: 'tax' },
      { amount: 500, label: 'Standard Shipping', type: 'shipping' },
    ])
  })

  it('should pass cumulative adjustments to subsequent hooks', async () => {
    const shippingHook: BeforeInitiatePaymentHook = () => [
      { amount: 500, label: 'Standard Shipping', type: 'shipping' },
    ]

    const taxOnTotalHook: BeforeInitiatePaymentHook = ({ adjustments, subtotal }) => {
      const currentTotal = subtotal + adjustments.reduce((sum, adj) => sum + adj.amount, 0)
      return [{ amount: Math.round(currentTotal * 0.1), label: 'Tax on total', type: 'tax' }]
    }

    const context = createMockInitiateContext({ subtotal: 1000 })
    const result = await runBeforeInitiatePaymentHooks([shippingHook, taxOnTotalHook], context)

    expect(result).toEqual([
      { amount: 500, label: 'Standard Shipping', type: 'shipping' },
      { amount: 150, label: 'Tax on total', type: 'tax' },
    ])
  })

  it('should handle async hooks', async () => {
    const asyncHook: BeforeInitiatePaymentHook = async () => {
      return [{ amount: 200, label: 'Async Tax', type: 'tax' }]
    }

    const context = createMockInitiateContext()
    const result = await runBeforeInitiatePaymentHooks([asyncHook], context)

    expect(result).toEqual([{ amount: 200, label: 'Async Tax', type: 'tax' }])
  })

  it('should throw when a hook throws, aborting payment', async () => {
    const failingHook: BeforeInitiatePaymentHook = () => {
      throw new Error('Tax service unavailable')
    }

    const neverReachedHook: BeforeInitiatePaymentHook = vi.fn(() => [])

    const context = createMockInitiateContext()

    await expect(
      runBeforeInitiatePaymentHooks([failingHook, neverReachedHook], context),
    ).rejects.toThrow('Tax service unavailable')

    expect(neverReachedHook).not.toHaveBeenCalled()
  })

  it('should handle hooks that return an empty array', async () => {
    const emptyHook: BeforeInitiatePaymentHook = () => []
    const taxHook: BeforeInitiatePaymentHook = () => [{ amount: 100, label: 'Tax', type: 'tax' }]

    const context = createMockInitiateContext()
    const result = await runBeforeInitiatePaymentHooks([emptyHook, taxHook], context)

    expect(result).toEqual([{ amount: 100, label: 'Tax', type: 'tax' }])
  })

  it('should preserve existing adjustments passed in context', async () => {
    const existingAdjustments: Adjustment[] = [{ amount: 50, label: 'Existing', type: 'custom' }]

    const taxHook: BeforeInitiatePaymentHook = () => [{ amount: 100, label: 'Tax', type: 'tax' }]

    const context = createMockInitiateContext({ adjustments: existingAdjustments })
    const result = await runBeforeInitiatePaymentHooks([taxHook], context)

    expect(result).toEqual([
      { amount: 50, label: 'Existing', type: 'custom' },
      { amount: 100, label: 'Tax', type: 'tax' },
    ])
  })
})

describe('runBeforeConfirmOrderHooks', () => {
  const createMockConfirmContext = () => ({
    customerEmail: 'test@example.com',
    data: { paymentIntentID: 'pi_123' } as Record<string, unknown>,
    req: {} as any,
  })

  it('should execute hooks sequentially', async () => {
    const executionOrder: number[] = []

    const hookOne: BeforeConfirmOrderHook = async () => {
      executionOrder.push(1)
    }

    const hookTwo: BeforeConfirmOrderHook = async () => {
      executionOrder.push(2)
    }

    const context = createMockConfirmContext()
    await runBeforeConfirmOrderHooks([hookOne, hookTwo], context)

    expect(executionOrder).toEqual([1, 2])
  })

  it('should throw when a hook throws', async () => {
    const failingHook: BeforeConfirmOrderHook = () => {
      throw new Error('Confirmation check failed')
    }

    const context = createMockConfirmContext()

    await expect(runBeforeConfirmOrderHooks([failingHook], context)).rejects.toThrow(
      'Confirmation check failed',
    )
  })

  it('should not execute subsequent hooks after a failure', async () => {
    const failingHook: BeforeConfirmOrderHook = () => {
      throw new Error('Failed')
    }

    const neverReachedHook: BeforeConfirmOrderHook = vi.fn()

    const context = createMockConfirmContext()

    await expect(
      runBeforeConfirmOrderHooks([failingHook, neverReachedHook], context),
    ).rejects.toThrow('Failed')

    expect(neverReachedHook).not.toHaveBeenCalled()
  })

  it('should handle empty hooks array', async () => {
    const context = createMockConfirmContext()
    await expect(runBeforeConfirmOrderHooks([], context)).resolves.toBeUndefined()
  })
})

describe('runAfterConfirmOrderHooks', () => {
  const createMockAfterContext = () => ({
    orderID: 'order-1' as any,
    req: {} as any,
    transactionID: 'txn-1' as any,
  })

  const mockLogger = {
    error: vi.fn(),
  }

  it('should not throw when a hook throws', async () => {
    const failingHook: AfterConfirmOrderHook = () => {
      throw new Error('Email service down')
    }

    const context = createMockAfterContext()
    mockLogger.error.mockClear()

    await expect(
      runAfterConfirmOrderHooks([failingHook], context, mockLogger),
    ).resolves.toBeUndefined()

    expect(mockLogger.error).toHaveBeenCalled()
  })

  it('should execute all hooks even if one fails', async () => {
    const executionOrder: number[] = []

    const failingHook: AfterConfirmOrderHook = () => {
      executionOrder.push(1)
      throw new Error('Hook 1 failed')
    }

    const successHook: AfterConfirmOrderHook = async () => {
      executionOrder.push(2)
    }

    const context = createMockAfterContext()
    mockLogger.error.mockClear()

    await runAfterConfirmOrderHooks([failingHook, successHook], context, mockLogger)

    expect(executionOrder).toEqual([1, 2])
    expect(mockLogger.error).toHaveBeenCalledTimes(1)
  })

  it('should handle empty hooks array', async () => {
    const context = createMockAfterContext()
    await expect(runAfterConfirmOrderHooks([], context, mockLogger)).resolves.toBeUndefined()
  })

  it('should pass correct context to hooks', async () => {
    const receivedArgs: any[] = []

    const captureHook: AfterConfirmOrderHook = (args) => {
      receivedArgs.push(args)
    }

    const context = createMockAfterContext()
    await runAfterConfirmOrderHooks([captureHook], context, mockLogger)

    expect(receivedArgs[0]).toEqual({
      orderID: 'order-1',
      req: {},
      transactionID: 'txn-1',
    })
  })
})
