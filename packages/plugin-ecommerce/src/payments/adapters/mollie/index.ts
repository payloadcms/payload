import type {
  createMollieClient,
  MollieClient,
  Payment as MolliePayment,
  PaymentStatus as MolliePaymentStatus,
} from '@mollie/api-client'
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

export type MollieAdapterArgs = {
  apiKey: string
  webhooks?: MollieWebhookHandlers
} & PaymentAdapterArgs

export const mollieAdapter: (props: MollieAdapterArgs) => PaymentAdapter = (props) => {
  const { apiKey, groupOverrides, webhooks } = props
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
