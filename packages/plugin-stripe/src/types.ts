import Stripe from "stripe"

export type WebhookHandler = (event: any, stripe: Stripe, stripeConfig: StripeConfig) => void;

export type StripeConfig = {
  stripeSecretKey: string
  stripeWebhookEndpointSecret?: string
  webhooks?: {
    [webhookName: string]: WebhookHandler
  }
}
