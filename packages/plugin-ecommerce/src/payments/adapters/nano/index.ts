import type { Field, GroupField } from 'payload'

import type {
  PaymentAdapter,
  PaymentAdapterArgs,
  PaymentAdapterClient,
  PaymentAdapterClientArgs,
} from '../../../types/index.js'

import { confirmOrder } from './confirmOrder.js'
import { initiatePayment } from './initiatePayment.js'
import { normalizeAccount, xnoToRaw } from './nano.js'

export type NanoAdapterArgs = {
  /**
   * The Nano account that receives payments, e.g. `nano_1...`. Its checksum is validated when the
   * adapter is created. Only the address is needed: no key or seed is ever given to Payload.
   */
  account: string
  /**
   * How old a send block may be, in seconds, when it is presented for an order.
   *
   * @default 86400
   */
  maxAgeSeconds?: number
  /**
   * Optional headers for the node RPC, e.g. an API key header required by a hosted node.
   */
  nodeHeaders?: Record<string, string>
  /**
   * The Nano node RPC URL used to read send blocks (`block_info`). It can be your own node or
   * a public RPC you trust.
   */
  nodeURL: string
  /**
   * The price of ONE smallest unit of each currency (the unit Payload stores amounts in, e.g. a
   * cent for USD), as an XNO decimal string. A currency that is not listed cannot be paid in Nano.
   *
   * @example { USD: '0.0001' }
   */
  prices: Record<string, string>
} & PaymentAdapterArgs

export const nanoAdapter: (props: NanoAdapterArgs) => PaymentAdapter = (props) => {
  const { groupOverrides, nodeHeaders, nodeURL } = props
  const label = props?.label || 'Nano'
  const account = normalizeAccount(props.account)
  const maxAgeSeconds = props.maxAgeSeconds ?? 86400

  if (!nodeURL || typeof nodeURL !== 'string') {
    throw new Error('A Nano node URL is required.')
  }

  if (!Number.isSafeInteger(maxAgeSeconds) || maxAgeSeconds <= 0) {
    throw new Error('maxAgeSeconds must be a positive integer.')
  }

  const prices: Record<string, string> = {}
  for (const [currency, price] of Object.entries(props.prices || {})) {
    if (xnoToRaw(price) <= 0n) {
      throw new Error(`The Nano price for ${currency} must be above zero.`)
    }
    prices[currency.toUpperCase()] = price
  }

  const baseFields: Field[] = [
    {
      name: 'reference',
      type: 'text',
      index: true,
      label: 'Nano order reference',
    },
    {
      name: 'payTo',
      type: 'text',
      label: 'Nano receiving account',
    },
    {
      name: 'amountRaw',
      type: 'text',
      label: 'Nano amount (raw)',
    },
    {
      name: 'representative',
      type: 'text',
      label: 'Nano binding representative',
    },
    {
      name: 'blockHash',
      type: 'text',
      index: true,
      label: 'Nano send block hash',
      // One block settles one transaction, enforced by the database so it holds across restarts
      // and concurrent requests.
      unique: true,
    },
    {
      name: 'shippingAddress',
      type: 'json',
      label: 'Shipping address at checkout',
    },
  ]

  const groupField: GroupField = {
    name: 'nano',
    type: 'group',
    ...groupOverrides,
    admin: {
      condition: (data) => {
        const path = 'paymentMethod'

        return data?.[path] === 'nano'
      },
      ...groupOverrides?.admin,
    },
    fields:
      groupOverrides?.fields && typeof groupOverrides?.fields === 'function'
        ? groupOverrides.fields({ defaultFields: baseFields })
        : baseFields,
  }

  return {
    name: 'nano',
    confirmOrder: confirmOrder({ account, maxAgeSeconds, nodeHeaders, nodeURL }),
    group: groupField,
    initiatePayment: initiatePayment({ account, prices }),
    label,
  }
}

export type NanoAdapterClientArgs = PaymentAdapterClientArgs

export const nanoAdapterClient: (props?: NanoAdapterClientArgs) => PaymentAdapterClient = (
  props,
) => {
  return {
    name: 'nano',
    confirmOrder: true,
    initiatePayment: true,
    label: props?.label || 'Nano',
  }
}

export type InitiatePaymentReturnType = {
  /** The exact amount to send, in raw (10^30 raw = 1 XNO). */
  amountRaw: string
  /** The same amount in XNO, for display. */
  amountXNO: string
  message: string
  /** The account to send to. */
  payTo: string
  /** Pass this back with the block hash to confirm the order. */
  reference: string
  /** The representative the payer must set on the send block. It binds the block to this order. */
  representative: string
  transactionID: number | string
}
