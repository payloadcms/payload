import { describe, expect, it, vi } from 'vitest'

import type {
  AfterConfirmOrderHook,
  BeforeConfirmOrderHook,
  BeforeInitiatePaymentHook,
  Summary,
} from '../types/index.js'

import {
  runAfterConfirmOrderHooks,
  runBeforeConfirmOrderHooks,
  runBeforeInitiatePaymentHooks,
} from './runPaymentHooks.js'

const createSummary = (subtotal = 1000): Summary => ({
  currency: 'USD',
  lines: [{ amount: subtotal, label: 'Subtotal', type: 'subtotal' }],
  total: subtotal,
})

const createMockInitiateContext = (overrides: Record<string, unknown> = {}) => ({
  billingAddress: undefined as any,
  cart: {
    id: 'cart-1',
    items: [{ id: 'item-1', product: 'prod-1', quantity: 1 }],
    subtotal: 1000,
  },
  currenciesConfig: {
    defaultCurrency: 'USD',
    supportedCurrencies: [{ code: 'USD', decimals: 2, label: 'US Dollar', symbol: '$' }],
  },
  currency: 'USD',
  customerEmail: 'test@example.com',
  req: {} as any,
  shippingAddress: undefined as any,
  summary: createSummary(),
  ...overrides,
})

describe('runBeforeInitiatePaymentHooks', () => {
  it('should return the incoming summary unchanged when no hooks are provided', async () => {
    const context = createMockInitiateContext()
    const result = await runBeforeInitiatePaymentHooks([], context)

    expect(result.total).toBe(1000)
    expect(result.lines).toHaveLength(1)
    expect(result.lines[0]?.type).toBe('subtotal')
  })

  it('should append a single line and recompute total', async () => {
    const taxHook: BeforeInitiatePaymentHook = ({ summary }) => ({
      ...summary,
      lines: [...summary.lines, { amount: 100, label: 'Sales Tax', type: 'tax' }],
    })

    const context = createMockInitiateContext()
    const result = await runBeforeInitiatePaymentHooks([taxHook], context)

    expect(result.lines).toHaveLength(2)
    expect(result.total).toBe(1100)
  })

  it('should pipe summary through multiple hooks and recompute total after each', async () => {
    const shippingHook: BeforeInitiatePaymentHook = ({ summary }) => ({
      ...summary,
      lines: [...summary.lines, { amount: 500, label: 'Standard Shipping', type: 'shipping' }],
    })

    const taxOnAllHook: BeforeInitiatePaymentHook = ({ summary }) => {
      const taxable = summary.lines.reduce((sum, l) => sum + l.amount, 0)
      return {
        ...summary,
        lines: [
          ...summary.lines,
          { amount: Math.round(taxable * 0.1), label: 'Tax (10%)', type: 'tax' },
        ],
      }
    }

    const context = createMockInitiateContext()
    const result = await runBeforeInitiatePaymentHooks([shippingHook, taxOnAllHook], context)

    expect(result.lines).toHaveLength(3)
    expect(result.total).toBe(1000 + 500 + Math.round(1500 * 0.1))
  })

  it('should ignore any total a hook tries to set and recompute from lines', async () => {
    const badHook: BeforeInitiatePaymentHook = ({ summary }) => ({
      ...summary,
      lines: [...summary.lines, { amount: 200, label: 'Tax', type: 'tax' }],
      total: 999999,
    })

    const context = createMockInitiateContext()
    const result = await runBeforeInitiatePaymentHooks([badHook], context)

    expect(result.total).toBe(1200)
  })

  it('should support async hooks', async () => {
    const asyncHook: BeforeInitiatePaymentHook = async ({ summary }) => ({
      ...summary,
      lines: [...summary.lines, { amount: 200, label: 'Async Tax', type: 'tax' }],
    })

    const context = createMockInitiateContext()
    const result = await runBeforeInitiatePaymentHooks([asyncHook], context)

    expect(result.total).toBe(1200)
  })

  it('should throw when a hook throws, aborting the pipeline', async () => {
    const failingHook: BeforeInitiatePaymentHook = () => {
      throw new Error('Tax service unavailable')
    }

    const neverReachedHook: BeforeInitiatePaymentHook = vi.fn(({ summary }) => summary)

    const context = createMockInitiateContext()

    await expect(
      runBeforeInitiatePaymentHooks([failingHook, neverReachedHook], context),
    ).rejects.toThrow('Tax service unavailable')

    expect(neverReachedHook).not.toHaveBeenCalled()
  })

  it('should throw when a hook removes the subtotal line', async () => {
    const badHook: BeforeInitiatePaymentHook = ({ summary }) => ({
      ...summary,
      lines: summary.lines.filter((l) => l.type !== 'subtotal'),
    })

    const context = createMockInitiateContext()

    await expect(runBeforeInitiatePaymentHooks([badHook], context)).rejects.toThrow(/subtotal line/)
  })

  it('should throw when a hook modifies the subtotal amount', async () => {
    const badHook: BeforeInitiatePaymentHook = ({ summary }) => ({
      ...summary,
      lines: [{ ...summary.lines[0]!, amount: 1 }, ...summary.lines.slice(1)],
    })

    const context = createMockInitiateContext()

    await expect(runBeforeInitiatePaymentHooks([badHook], context)).rejects.toThrow(
      /subtotal amount/i,
    )
  })

  it('should throw when a hook changes currency', async () => {
    const badHook: BeforeInitiatePaymentHook = ({ summary }) => ({
      ...summary,
      currency: 'EUR',
    })

    const context = createMockInitiateContext()

    await expect(runBeforeInitiatePaymentHooks([badHook], context)).rejects.toThrow(/currency/i)
  })

  it('should allow negative line amounts (discounts) and reflect them in total', async () => {
    const discountHook: BeforeInitiatePaymentHook = ({ summary }) => ({
      ...summary,
      lines: [...summary.lines, { amount: -200, label: 'Discount: SAVE20', type: 'discount' }],
    })

    const context = createMockInitiateContext()
    const result = await runBeforeInitiatePaymentHooks([discountHook], context)

    expect(result.total).toBe(800)
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
