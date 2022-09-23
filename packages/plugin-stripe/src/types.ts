import { Payload } from "payload";
import Stripe from "stripe";

export type StripeWebhookHandler = (payload: Payload, event: any, stripe: Stripe, stripeConfig?: StripeConfig) => void;

export type StripeWebhookHandlers = {
  [webhookName: string]: StripeWebhookHandler
}

export type StripeConfig = {
  stripeSecretKey: string
  stripeWebhooksEndpointSecret?: string
  webhooks?: StripeWebhookHandler | StripeWebhookHandlers
  collections?: string[]
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

