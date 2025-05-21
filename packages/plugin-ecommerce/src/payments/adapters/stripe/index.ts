import type { Field, GroupField, PayloadRequest } from 'payload'
import type { Stripe } from 'stripe'

import type { BasePaymentAdapterArgs, PaymentAdapter } from '../../../types.js'

import { webhooksEndpoint } from './endpoints/webhooks.js'
import { createTransaction } from './hooks/createTransaction.js'

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
  webhookSecret: string
} & BasePaymentAdapterArgs

export const stripeAdapter: (props: StripeAdapterArgs) => PaymentAdapter = (props) => {
  const { apiVersion, appInfo, groupOverrides, secretKey, webhooks, webhookSecret } = props
  const label = props?.label || 'Stripe'

  const baseFields: Field[] = [
    {
      name: 'stripeCustomerID',
      type: 'text',
      label: 'Stripe Customer ID',
      required: true,
    },
    {
      name: 'stripePaymentIntentID',
      type: 'text',
      label: 'Stripe PaymentIntent ID',
      required: true,
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
    endpoints: [webhooksEndpoint({ apiVersion, appInfo, secretKey, webhooks, webhookSecret })],
    group: groupField,
    hooks: {
      createTransaction: createTransaction({
        apiVersion,
        appInfo,
        secretKey,
      }),
    },
    label,
  }
}
