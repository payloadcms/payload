import type { Endpoint } from 'payload';
import Stripe from 'stripe';
import type { StripeAdapterArgs } from '../index.js';
type Props = {
    apiVersion?: Stripe.StripeConfig['apiVersion'];
    appInfo?: Stripe.StripeConfig['appInfo'];
    secretKey: StripeAdapterArgs['secretKey'];
    webhooks?: StripeAdapterArgs['webhooks'];
    webhookSecret: StripeAdapterArgs['webhookSecret'];
};
export declare const webhooksEndpoint: (props: Props) => Endpoint;
export {};
//# sourceMappingURL=webhooks.d.ts.map