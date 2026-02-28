import type {
  createMollieClient,
  MollieClient,
  Customer as MollieCustomer,
  Payment as MolliePayment,
  PaymentStatus as MolliePaymentStatus,
} from '@mollie/api-client'
import type { CreateParameters } from '@mollie/api-client/dist/types/binders/payments/parameters.js'
import type { Field, GroupField, PayloadRequest } from 'payload'

import type {
  PaymentAdapter,
  PaymentAdapterArgs,
  PaymentAdapterClient,
  PaymentAdapterClientArgs,
} from '../../../types/index.js'

import { confirmOrder } from './confirmOrder.js'
import { webhooksEndpoint } from './endpoints/webhooks.js'
import { initiatePayment } from './initiatePayment.js'

type MollieWebhookHandler = (args: {
  mollie: MollieClient
  payment: MolliePayment
  req: PayloadRequest
}) => Promise<void> | void

type MollieWebhookHandlers = {
  /**
   * The payment status to handle (e.g., paid, failed, etc.).
   */
  [paymentStatus in MolliePaymentStatus]: MollieWebhookHandler
}

type CreatePaymentParameters = Partial<Omit<CreateParameters, 'amount' | 'customerId'>>

export type MollieAdapterArgs = {
  apiKey: string
  createPayment?: (args: {
    /**
     * The amount of the payment in cents.
     * @example 1000 (10.00 USD)
     */
    amount: number
    /**
     * The currency of the payment.
     * @example 'USD'
     */
    currency: string
    /**
     * The Mollie customer object.
     */
    customer: MollieCustomer
  }) => CreatePaymentParameters | Promise<CreatePaymentParameters>
  webhooks?: MollieWebhookHandlers
} & PaymentAdapterArgs

export const mollieAdapter: (props: MollieAdapterArgs) => PaymentAdapter = (props) => {
  const { apiKey, createPayment, groupOverrides, webhooks } = props
  const label = props?.label || 'Mollie'

  const baseFields: Field[] = [
    {
      name: 'customerID',
      type: 'text',
      label: 'Mollie Customer ID',
    },
    {
      name: 'paymentID',
      type: 'text',
      label: 'Mollie Payment ID',
    },
  ]

  const groupField: GroupField = {
    name: 'mollie',
    type: 'group',
    ...groupOverrides,
    admin: {
      condition: (data) => {
        const path = 'paymentMethod'

        return data?.[path] === 'mollie'
      },
      ...groupOverrides?.admin,
    },
    fields:
      groupOverrides?.fields && typeof groupOverrides?.fields === 'function'
        ? groupOverrides.fields({ defaultFields: baseFields })
        : baseFields,
  }

  return {
    name: 'mollie',
    confirmOrder: confirmOrder({
      apiKey,
    }),
    endpoints: [webhooksEndpoint({ apiKey, webhooks })],
    group: groupField,
    initiatePayment: initiatePayment({
      apiKey,
      createPayment,
    }),
    label,
  }
}

// Placeholder for client side adapter
// Mollie has no client side SDK yet
export type MollieAdapterClientArgs = {} & PaymentAdapterClientArgs

export const mollieAdapterClient: (props: MollieAdapterClientArgs) => PaymentAdapterClient = (
  props,
) => {
  return {
    name: 'mollie',
    confirmOrder: true,
    initiatePayment: true,
    label: 'Card',
  }
}

export type InitiatePaymentReturnType = {
  href: string
  message: string
  paymentID: string
}
