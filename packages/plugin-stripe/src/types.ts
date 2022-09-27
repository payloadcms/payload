import { Payload } from "payload";
import { Config as PayloadConfig } from "payload/config";
import Stripe from "stripe";

export type StripeWebhookHandler = (args: {
  payload: Payload,
  event: any,
  stripe: Stripe,
  config: PayloadConfig
  stripeConfig?: StripeConfig
}) => void;

export type StripeWebhookHandlers = {
  [webhookName: string]: StripeWebhookHandler
}

export type FieldSyncConfig = {
  field: string
  property: string
}

export type SyncConfig = {
  collection: string
  resource: 'customers' // TODO: get this from Stripe types
  resourceSingular: 'customer' // TODO: there must be a better way to do this
  fields: FieldSyncConfig[]
}

export type StripeConfig = {
  stripeSecretKey: string
  stripeWebhooksEndpointSecret?: string
  webhooks?: StripeWebhookHandler | StripeWebhookHandlers
  sync?: SyncConfig[]
}

export type SanitizedStripeConfig = StripeConfig & {
  sync: SyncConfig[] // convert to required
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

