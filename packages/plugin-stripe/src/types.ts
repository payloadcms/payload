import { Payload } from "payload";
import Stripe from "stripe";

export type StripeWebhookHandler = (payload: Payload, event: any, stripe: Stripe, stripeConfig?: StripeConfig) => void;

export type StripeWebhookHandlers = {
  [webhookName: string]: StripeWebhookHandler
}

export type FieldSyncConfig = {
  field: string
  property: string
}

export type StripeConfig = {
  stripeSecretKey: string
  stripeWebhooksEndpointSecret?: string
  webhooks?: StripeWebhookHandler | StripeWebhookHandlers
  sync?: { // NOTE: can this also be string[] ??
    collection: string
    object: 'customers' // TODO: get this from Stripe types
    fields: FieldSyncConfig[]
  }[]
}

export type StripeProxy = (args: {
  stripeSecretKey: string
  stripeMethod: string
  stripeArgs: any[]
}) => Promise<{
  status: number
  message?: string
  data?: any
}>

