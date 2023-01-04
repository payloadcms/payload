import { Payload } from "payload";
import { Config as PayloadConfig } from "payload/config";
import Stripe from "stripe";

export type StripeWebhookHandler<T = any> = (args: {
  payload: Payload,
  event: T,
  stripe: Stripe,
  config: PayloadConfig
  stripeConfig?: StripeConfig
}) => void;

export type StripeWebhookHandlers = {
  [webhookName: string]: StripeWebhookHandler
}

export type FieldSyncConfig = {
  fieldPath: string
  stripeProperty: string
}

export type SyncConfig = {
  collection: string
  stripeResourceType: 'customers' | 'products' // TODO: get this from Stripe types
  stripeResourceTypeSingular: 'customer' | 'product' // TODO: there must be a better way to do this
  fields: FieldSyncConfig[]
}

export type StripeConfig = {
  stripeSecretKey: string
  isTestKey?: boolean
  stripeWebhooksEndpointSecret?: string
  webhooks?: StripeWebhookHandler | StripeWebhookHandlers
  sync?: SyncConfig[]
  logs?: boolean
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

