import Stripe from "stripe"

export type StripeWebhookHandler = (event: any, stripe: Stripe, stripeConfig: StripeConfig) => void;

export type StripeConfig = {
  stripeSecretKey: string
  stripeWebhookEndpointSecret?: string
  webhooks?: {
    [webhookName: string]: StripeWebhookHandler
  }
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

