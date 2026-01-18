import type { PayloadRequest } from 'payload';
import type { Stripe } from 'stripe';
import type { PaymentAdapter, PaymentAdapterArgs, PaymentAdapterClient, PaymentAdapterClientArgs } from '../../../types/index.js';
type StripeWebhookHandler = (args: {
    event: Stripe.Event;
    req: PayloadRequest;
    stripe: Stripe;
}) => Promise<void> | void;
type StripeWebhookHandlers = {
    /**
     * Description of the event (e.g., invoice.created or charge.refunded).
     */
    [webhookName: string]: StripeWebhookHandler;
};
export type StripeAdapterArgs = {
    /**
     * This library's types only reflect the latest API version.
     *
     * We recommend upgrading your account's API Version to the latest version
     * if you wish to use TypeScript with this library.
     *
     * If you wish to remain on your account's default API version,
     * you may pass `null` or another version instead of the latest version,
     * and add a `@ts-ignore` comment here and anywhere the types differ between API versions.
     *
     * @docs https://stripe.com/docs/api/versioning
     */
    apiVersion?: Stripe.StripeConfig['apiVersion'];
    appInfo?: Stripe.StripeConfig['appInfo'];
    publishableKey: string;
    secretKey: string;
    webhooks?: StripeWebhookHandlers;
    webhookSecret?: string;
} & PaymentAdapterArgs;
export declare const stripeAdapter: (props: StripeAdapterArgs) => PaymentAdapter;
export type StripeAdapterClientArgs = {
    /**
     * This library's types only reflect the latest API version.
     *
     * We recommend upgrading your account's API Version to the latest version
     * if you wish to use TypeScript with this library.
     *
     * If you wish to remain on your account's default API version,
     * you may pass `null` or another version instead of the latest version,
     * and add a `@ts-ignore` comment here and anywhere the types differ between API versions.
     *
     * @docs https://stripe.com/docs/api/versioning
     */
    apiVersion?: Stripe.StripeConfig['apiVersion'];
    appInfo?: Stripe.StripeConfig['appInfo'];
    publishableKey: string;
} & PaymentAdapterClientArgs;
export declare const stripeAdapterClient: (props: StripeAdapterClientArgs) => PaymentAdapterClient;
export type InitiatePaymentReturnType = {
    clientSecret: string;
    message: string;
    paymentIntentID: string;
};
export {};
//# sourceMappingURL=index.d.ts.map