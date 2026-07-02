import type {
  AfterConfirmOrderHook,
  BeforeConfirmOrderHook,
  BeforeInitiatePaymentHook,
  Line,
  PaymentAdapter,
  Summary,
} from '@payloadcms/plugin-ecommerce/types'

type MockState = {
  adapterAfterConfirmOrder: Array<{ orderID: unknown; transactionID: unknown }>
  adapterBeforeConfirmOrder: Array<{ data: unknown }>
  adapterBeforeInitiatePayment: Array<{ summary: Summary }>
  confirmOrderCalls: Array<{ data: unknown }>
  initiateCalls: Array<{ summary: Summary }>
  pluginAfterConfirmOrder: Array<{ orderID: unknown; transactionID: unknown }>
  pluginBeforeConfirmOrder: Array<{ data: unknown }>
  pluginBeforeInitiatePayment: Array<{ summary: Summary }>
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

const cloneSummary = (summary: Summary): Summary => ({
  currency: summary.currency,
  lines: summary.lines.map((line) => ({ ...line })),
  total: summary.total,
})

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
    ({ summary }) => {
      mockState.pluginBeforeInitiatePayment.push({ summary: cloneSummary(summary) })
      return summary
    },
  ],
}

type MockAdapterOptions = {
  addTenPercentTax?: boolean
  appendLines?: Line[]
  failConfirmOrder?: boolean
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
      ({ summary }) => {
        mockState.adapterBeforeInitiatePayment.push({ summary: cloneSummary(summary) })

        if (currentOptions.throwInBeforeInitiatePayment) {
          throw new Error('Adapter beforeInitiatePayment failure')
        }

        if (currentOptions.addTenPercentTax) {
          const taxableAmount = summary.lines.reduce((sum, line) => sum + line.amount, 0)
          return {
            ...summary,
            lines: [
              ...summary.lines,
              {
                amount: Math.round(taxableAmount * 0.1),
                label: 'Tax (10%)',
                type: 'tax',
              },
            ],
          }
        }

        if (currentOptions.appendLines && currentOptions.appendLines.length > 0) {
          return {
            ...summary,
            lines: [...summary.lines, ...currentOptions.appendLines],
          }
        }

        return summary
      },
    ],
  },
  initiatePayment: async ({ data, req, transactionsSlug }) => {
    const payload = req.payload
    const mockPaymentID = `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`

    mockState.initiateCalls.push({ summary: cloneSummary(data.summary) })

    const flattenedCart = data.cart.items.map((item) => ({
      product: typeof item.product === 'object' ? item.product.id : item.product,
      quantity: item.quantity,
      ...(item.variant
        ? { variant: typeof item.variant === 'object' ? item.variant.id : item.variant }
        : {}),
    }))

    const transaction = await payload.create({
      collection: transactionsSlug,
      data: {
        ...(req.user ? { customer: req.user.id } : { customerEmail: data.customerEmail }),
        amount: data.summary.total,
        currency: data.currency,
        items: flattenedCart,
        mock: { mockPaymentID },
        paymentMethod: 'mock',
        status: 'pending',
      },
      req,
    })

    return {
      message: 'Mock payment initiated',
      mockPaymentID,
      transactionID: transaction.id,
    }
  },
}
