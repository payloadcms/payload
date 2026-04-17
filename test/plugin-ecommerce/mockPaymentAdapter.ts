import type {
  Adjustment,
  AfterConfirmOrderHook,
  BeforeConfirmOrderHook,
  BeforeInitiatePaymentHook,
  PaymentAdapter,
} from '@payloadcms/plugin-ecommerce/types'

type MockState = {
  adapterAfterConfirmOrder: Array<{ orderID: unknown; transactionID: unknown }>
  adapterBeforeConfirmOrder: Array<{ data: unknown }>
  adapterBeforeInitiatePayment: Array<{ adjustments: Adjustment[]; subtotal: number }>
  confirmOrderCalls: Array<{ data: unknown }>
  initiateCalls: Array<{ adjustments?: Adjustment[]; subtotal: number; total?: number }>
  pluginAfterConfirmOrder: Array<{ orderID: unknown; transactionID: unknown }>
  pluginBeforeConfirmOrder: Array<{ data: unknown }>
  pluginBeforeInitiatePayment: Array<{ adjustments: Adjustment[]; subtotal: number }>
}

export const mockState: MockState = {
  adapterAfterConfirmOrder: [],
  adapterBeforeConfirmOrder: [],
  adapterBeforeInitiatePayment: [],
  confirmOrderCalls: [],
  initiateCalls: [],
  pluginAfterConfirmOrder: [],
  pluginBeforeConfirmOrder: [],
  pluginBeforeInitiatePayment: [],
}

export const resetMockState = () => {
  mockState.adapterAfterConfirmOrder = []
  mockState.adapterBeforeConfirmOrder = []
  mockState.adapterBeforeInitiatePayment = []
  mockState.confirmOrderCalls = []
  mockState.initiateCalls = []
  mockState.pluginAfterConfirmOrder = []
  mockState.pluginBeforeConfirmOrder = []
  mockState.pluginBeforeInitiatePayment = []
}

export const mockPluginHooks: {
  afterConfirmOrder: AfterConfirmOrderHook[]
  beforeConfirmOrder: BeforeConfirmOrderHook[]
  beforeInitiatePayment: BeforeInitiatePaymentHook[]
} = {
  afterConfirmOrder: [
    ({ orderID, transactionID }) => {
      mockState.pluginAfterConfirmOrder.push({ orderID, transactionID })
    },
  ],
  beforeConfirmOrder: [
    ({ data }) => {
      mockState.pluginBeforeConfirmOrder.push({ data })
    },
  ],
  beforeInitiatePayment: [
    ({ adjustments, subtotal }) => {
      mockState.pluginBeforeInitiatePayment.push({ adjustments: [...adjustments], subtotal })
      return []
    },
  ],
}

type MockAdapterOptions = {
  addTenPercentTax?: boolean
  failConfirmOrder?: boolean
  injectAdjustments?: Adjustment[]
  throwInAfterConfirmOrder?: boolean
  throwInBeforeConfirmOrder?: boolean
  throwInBeforeInitiatePayment?: boolean
}

let currentOptions: MockAdapterOptions = {}

export const setMockAdapterOptions = (options: MockAdapterOptions) => {
  currentOptions = options
}

export const resetMockAdapterOptions = () => {
  currentOptions = {}
}

export const mockPaymentAdapter: PaymentAdapter = {
  name: 'mock',
  confirmOrder: async ({ data, ordersSlug, req, transactionsSlug }) => {
    mockState.confirmOrderCalls.push({ data })

    const payload = req.payload

    const transactions = await payload.find({
      collection: transactionsSlug ?? 'transactions',
      depth: 0,
      where: {
        'mock.mockPaymentID': {
          equals: (data as { mockPaymentID: string }).mockPaymentID,
        },
      },
    })

    const transaction = transactions.docs[0]

    if (!transaction) {
      throw new Error('Mock transaction not found')
    }

    const order = await payload.create({
      collection: ordersSlug ?? 'orders',
      data: {
        amount: transaction.amount,
        currency: transaction.currency,
        customerEmail: transaction.customerEmail,
        items: transaction.items,
        status: 'processing',
        transactions: [transaction.id],
      },
      req,
    })

    await payload.update({
      id: transaction.id,
      collection: transactionsSlug ?? 'transactions',
      data: {
        order: order.id,
        status: 'succeeded',
      },
      req,
    })

    return {
      message: 'Mock order confirmed',
      orderID: order.id,
      transactionID: transaction.id,
    }
  },
  group: {
    name: 'mock',
    type: 'group',
    admin: {
      condition: (data) => data?.paymentMethod === 'mock',
    },
    fields: [
      {
        name: 'mockPaymentID',
        type: 'text',
      },
    ],
  },
  hooks: {
    afterConfirmOrder: [
      ({ orderID, transactionID }) => {
        mockState.adapterAfterConfirmOrder.push({ orderID, transactionID })
        if (currentOptions.throwInAfterConfirmOrder) {
          throw new Error('Adapter afterConfirmOrder failure')
        }
      },
    ],
    beforeConfirmOrder: [
      ({ data }) => {
        mockState.adapterBeforeConfirmOrder.push({ data })
        if (currentOptions.throwInBeforeConfirmOrder) {
          throw new Error('Adapter beforeConfirmOrder failure')
        }
      },
    ],
    beforeInitiatePayment: [
      ({ adjustments, subtotal }) => {
        mockState.adapterBeforeInitiatePayment.push({ adjustments: [...adjustments], subtotal })
        if (currentOptions.throwInBeforeInitiatePayment) {
          throw new Error('Adapter beforeInitiatePayment failure')
        }
        if (currentOptions.addTenPercentTax) {
          const taxableAmount = subtotal + adjustments.reduce((sum, adj) => sum + adj.amount, 0)
          return [
            {
              amount: Math.round(taxableAmount * 0.1),
              label: 'Tax (10%)',
              type: 'tax',
            },
          ]
        }
        return currentOptions.injectAdjustments ?? []
      },
    ],
  },
  initiatePayment: async ({ data, req, transactionsSlug }) => {
    const payload = req.payload
    const mockPaymentID = `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`

    mockState.initiateCalls.push({
      adjustments: data.adjustments,
      subtotal: data.cart.subtotal ?? 0,
      total: data.total,
    })

    const flattenedCart = data.cart.items.map((item) => ({
      product: typeof item.product === 'object' ? item.product.id : item.product,
      quantity: item.quantity,
      ...(item.variant
        ? { variant: typeof item.variant === 'object' ? item.variant.id : item.variant }
        : {}),
    }))

    await payload.create({
      collection: transactionsSlug,
      data: {
        ...(req.user ? { customer: req.user.id } : { customerEmail: data.customerEmail }),
        amount: data.total ?? data.cart.subtotal,
        currency: data.currency,
        items: flattenedCart,
        mock: { mockPaymentID },
        paymentMethod: 'mock',
        status: 'pending',
      },
      req,
    })

    return {
      adjustments: data.adjustments,
      message: 'Mock payment initiated',
      mockPaymentID,
      total: data.total,
    }
  },
}
