import type { CollectionSlug, Payload, Config as PayloadConfig, PayloadRequest } from 'payload'
import type Stripe from 'stripe'

/**
 * A handler function invoked when a Stripe webhook event is received.
 *
 * @template T - The type of the Stripe event. Defaults to `any`.
 *
 * @param args.config - The raw Payload configuration object.
 * @param args.event - The Stripe webhook event object.
 * @param args.payload - The initialized Payload instance.
 * @param args.pluginConfig - The resolved Stripe plugin configuration, if available.
 * @param args.req - The incoming Payload request object.
 * @param args.stripe - An initialized Stripe SDK instance.
 */
export type StripeWebhookHandler<T = any> = (args: {
  config: PayloadConfig
  event: T
  payload: Payload
  pluginConfig?: StripePluginConfig
  req: PayloadRequest
  stripe: Stripe
}) => Promise<void> | void

/**
 * A map of Stripe webhook event names to their corresponding handler functions.
 * The key should match the Stripe event type (e.g. `'customer.created'`).
 */
export type StripeWebhookHandlers = {
  [webhookName: string]: StripeWebhookHandler
}

/**
 * Describes the mapping between a single Payload document field and a Stripe resource property.
 *
 * @param fieldPath - The dot-notation path to the field in the Payload document (e.g. `'name'`).
 * @param stripeProperty - The property key on the corresponding Stripe resource (e.g. `'name'`).
 */
export type FieldSyncConfig = {
  fieldPath: string
  stripeProperty: string
}

/**
 * Maps each supported Stripe resource type (plural API key) to its singular display name.
 * This is used to derive `stripeResourceTypeSingular` from `stripeResourceType` without
 * maintaining a separate, manually-synced union type.
 *
 * @internal
 */
type StripeResourceSingularMap = {
  customers: 'customer'
  products: 'product'
}

/**
 * The set of Stripe resource types that the plugin supports for bidirectional sync.
 * Derived directly from the Stripe SDK's instance keys so it stays in sync with the SDK.
 *
 * @internal
 */
type SupportedStripeResourceType = keyof Pick<Stripe, 'customers' | 'products'>

/**
 * Configuration for syncing a Payload collection with a Stripe resource.
 *
 * @param collection - The slug of the Payload collection to sync.
 * @param fields - An array of field mappings between the Payload document and the Stripe resource.
 * @param stripeResourceType - The Stripe API resource key (e.g. `'customers'`, `'products'`).
 *   This is derived from the Stripe SDK's type definitions.
 * @param stripeResourceTypeSingular - The singular form of the Stripe resource type
 *   (e.g. `'customer'`, `'product'`). This is derived from `stripeResourceType` via
 *   `StripeResourceSingularMap`, so both values are always kept in sync.
 */
export type SyncConfig = {
  collection: CollectionSlug
  fields: FieldSyncConfig[]
  stripeResourceType: SupportedStripeResourceType
  stripeResourceTypeSingular: StripeResourceSingularMap[SupportedStripeResourceType]
}

/**
 * Configuration options for the Payload Stripe plugin.
 *
 * @param isTestKey - When `true`, the Stripe dashboard links in the admin UI will
 *   point to Stripe's test-mode environment. Should match whether `stripeSecretKey`
 *   is a test key (`sk_test_...`).
 * @param logs - When `true`, the plugin will log Stripe sync operations to the Payload logger.
 * @param rest - When `true`, exposes a REST proxy endpoint (`/api/stripe/rest`) that allows
 *   the Payload admin to make authenticated Stripe API calls from the client.
 *   @default false
 * @param stripeSecretKey - Your Stripe secret API key (`sk_live_...` or `sk_test_...`).
 * @param stripeWebhooksEndpointSecret - The webhook signing secret from your Stripe dashboard,
 *   used to verify that incoming webhook payloads are from Stripe.
 * @param sync - An array of collection sync configurations for bidirectional Stripe sync.
 * @param webhooks - One or more webhook handler functions mapped to Stripe event types.
 */
export type StripePluginConfig = {
  isTestKey?: boolean
  logs?: boolean
  /** @default false */
  rest?: boolean
  stripeSecretKey: string
  stripeWebhooksEndpointSecret?: string
  sync?: SyncConfig[]
  webhooks?: StripeWebhookHandler | StripeWebhookHandlers
}

/**
 * An internal, sanitized version of `StripePluginConfig` where optional fields
 * have been resolved to their defaults. Used internally by the plugin after initialization.
 *
 * @param sync - Always present (defaults to an empty array).
 */
export type SanitizedStripePluginConfig = {
  sync: SyncConfig[] // convert to required
} & StripePluginConfig

/**
 * The signature for the Stripe REST proxy handler.
 * Allows calling Stripe API methods from the client via a secure server-side proxy.
 *
 * @param args.stripeArgs - Positional arguments to pass to the Stripe SDK method.
 * @param args.stripeMethod - Dot-notation path to the Stripe SDK method (e.g. `'customers.create'`).
 * @param args.stripeSecretKey - The Stripe secret key used to authenticate the request.
 *
 * @returns A promise resolving to an object with the response `data`, an optional
 *   error `message`, and an HTTP `status` code.
 */
export type StripeProxy = (args: {
  stripeArgs: any[]
  stripeMethod: string
  stripeSecretKey: string
}) => Promise<{
  data?: any
  message?: string
  status: number
}>
