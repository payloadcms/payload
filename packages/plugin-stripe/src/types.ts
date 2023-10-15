import type { Payload } from 'payload'
import type { Config as PayloadConfig } from 'payload/config'
import type Stripe from 'stripe'

export type StripeWebhookHandler<T = any> = (args: {
  payload: Payload
  event: T
  stripe: Stripe
  config: PayloadConfig
  stripeConfig?: StripeConfig
}) => void

export interface StripeWebhookHandlers {
  [webhookName: string]: StripeWebhookHandler
}

export interface FieldSyncConfig {
  fieldPath: string
  stripeProperty: string
}

export interface SyncConfig {
  collection: string
  stripeResourceType: 'customers' | 'products' // TODO: get this from Stripe types
  stripeResourceTypeSingular: 'customer' | 'product' // TODO: there must be a better way to do this
  fields: FieldSyncConfig[]
}

export interface StripeConfig {
  stripeSecretKey: string
  isTestKey?: boolean
  stripeWebhooksEndpointSecret?: string
  // @deprecated this will default as `false` in the next major version release
  rest?: boolean
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
