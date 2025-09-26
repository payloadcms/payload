import type { Field, GroupField, PayloadRequest } from 'payload'
import type { Stripe } from 'stripe'

import type {
  PaymentAdapter,
  PaymentAdapterArgs,
  PaymentAdapterClient,
  PaymentAdapterClientArgs,
} from '../../../types/index.js'

import { confirmOrder } from './confirmOrder.js'
import { webhooksEndpoint } from './endpoints/webhooks.js'
import { initiatePayment } from './initiatePayment.js'

type StripeWebhookHandler = (args: {
  event: Stripe.Event
  req: PayloadRequest
  stripe: Stripe
}) => Promise<void> | void

type StripeWebhookHandlers = {
  /**
   * Description of the event (e.g., invoice.created or charge.refunded).
   */
  [webhookName: string]: StripeWebhookHandler
}

export type StripeAdapterArgs = {
  /**
   * This library's types only reflect the latest API version.
   *
   * We recommend upgrading your account's API Version to the latest version
   * if you wish to use TypeScript with this library.
   *
   * If you wish to remain on your account's default API version,
   * you may pass `null` or another version instead of the latest version,
   * and add a `@ts-ignore` comment here and anywhere the types differ between API versions.
   *
   * @docs https://stripe.com/docs/api/versioning
   */
  apiVersion?: Stripe.StripeConfig['apiVersion']
  appInfo?: Stripe.StripeConfig['appInfo']
  publishableKey: string
  secretKey: string
  webhooks?: StripeWebhookHandlers
  webhookSecret?: string
} & PaymentAdapterArgs

export const stripeAdapter: (props: StripeAdapterArgs) => PaymentAdapter = (props) => {
  const { apiVersion, appInfo, groupOverrides, secretKey, webhooks, webhookSecret } = props
  const label = props?.label || 'Stripe'

  const baseFields: Field[] = [
    {
      name: 'customerID',
      type: 'text',
      label: 'Stripe Customer ID',
    },
    {
      name: 'paymentIntentID',
      type: 'text',
      label: 'Stripe PaymentIntent ID',
    },
  ]

  const groupField: GroupField = {
    name: 'stripe',
    type: 'group',
    ...groupOverrides,
    admin: {
      condition: (data) => {
        const path = 'paymentMethod'

        return data?.[path] === 'stripe'
      },
      ...groupOverrides?.admin,
    },
    fields:
      groupOverrides?.fields && typeof groupOverrides?.fields === 'function'
        ? groupOverrides.fields({ defaultFields: baseFields })
        : baseFields,
  }

  return {
    name: 'stripe',
    confirmOrder: confirmOrder({
      apiVersion,
      appInfo,
      secretKey,
    }),
    endpoints: [webhooksEndpoint({ apiVersion, appInfo, secretKey, webhooks, webhookSecret })],
    group: groupField,
    initiatePayment: initiatePayment({
      apiVersion,
      appInfo,
      secretKey,
    }),
    label,
  }
}

export type StripeAdapterClientArgs = {
  /**
   * This library's types only reflect the latest API version.
   *
   * We recommend upgrading your account's API Version to the latest version
   * if you wish to use TypeScript with this library.
   *
   * If you wish to remain on your account's default API version,
   * you may pass `null` or another version instead of the latest version,
   * and add a `@ts-ignore` comment here and anywhere the types differ between API versions.
   *
   * @docs https://stripe.com/docs/api/versioning
   */
  apiVersion?: Stripe.StripeConfig['apiVersion']
  appInfo?: Stripe.StripeConfig['appInfo']
  publishableKey: string
} & PaymentAdapterClientArgs

export const stripeAdapterClient: (props: StripeAdapterClientArgs) => PaymentAdapterClient = (
  props,
) => {
  return {
    name: 'stripe',
    confirmOrder: true,
    initiatePayment: true,
    label: 'Card',
  }
}

export type InitiatePaymentReturnType = {
  clientSecret: string
  message: string
  paymentIntentID: string
}
