import type { CollectionSlug, Payload, Config as PayloadConfig, PayloadRequest } from 'payload';
import type Stripe from 'stripe';
export type StripeWebhookHandler<T = any> = (args: {
    config: PayloadConfig;
    event: T;
    payload: Payload;
    pluginConfig?: StripePluginConfig;
    req: PayloadRequest;
    stripe: Stripe;
}) => Promise<void> | void;
export type StripeWebhookHandlers = {
    [webhookName: string]: StripeWebhookHandler;
};
export type FieldSyncConfig = {
    fieldPath: string;
    stripeProperty: string;
};
export type SyncConfig = {
    collection: CollectionSlug;
    fields: FieldSyncConfig[];
    stripeResourceType: 'customers' | 'products';
    stripeResourceTypeSingular: 'customer' | 'product';
};
export type StripePluginConfig = {
    isTestKey?: boolean;
    logs?: boolean;
    /** @default false */
    rest?: boolean;
    stripeSecretKey: string;
    stripeWebhooksEndpointSecret?: string;
    sync?: SyncConfig[];
    webhooks?: StripeWebhookHandler | StripeWebhookHandlers;
};
export type SanitizedStripePluginConfig = {
    sync: SyncConfig[];
} & StripePluginConfig;
export type StripeProxy = (args: {
    stripeArgs: any[];
    stripeMethod: string;
    stripeSecretKey: string;
}) => Promise<{
    data?: any;
    message?: string;
    status: number;
}>;
//# sourceMappingURL=types.d.ts.map