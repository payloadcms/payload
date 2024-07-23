import type { Payload } from 'payload'
import type { Config as PayloadConfig } from 'payload/config'
import type Stripe from 'stripe'

export type StripeWebhookHandler<T = any> = (args: {
  config: PayloadConfig
  event: T
  payload: Payload
  stripe: Stripe
  stripeConfig?: StripeConfig
}) => Promise<void> | void

export interface StripeWebhookHandlers {
  [webhookName: string]: StripeWebhookHandler
}

export interface FieldSyncConfig {
  fieldPath: string
  stripeProperty: string
}

export interface SyncConfig {
  collection: string
  fields: FieldSyncConfig[]
  stripeResourceType: 'customers' | 'products' // TODO: get this from Stripe types
  stripeResourceTypeSingular: 'customer' | 'product' // TODO: there must be a better way to do this
}

export interface StripeConfig {
  isTestKey?: boolean
  logs?: boolean
  // @deprecated this will default as `false` in the next major version release
  rest?: boolean
  stripeSecretKey: string
  stripeWebhooksEndpointSecret?: string
  sync?: SyncConfig[]
  webhooks?: StripeWebhookHandler | StripeWebhookHandlers
}

export type SanitizedStripeConfig = StripeConfig & {
  sync: SyncConfig[] // convert to required
}

export type StripeProxy = (args: {
  stripeArgs: any[]
  stripeMethod: string
  stripeSecretKey: string
}) => Promise<{
  data?: any
  message?: string
  status: number
}>
