import type { Config as PayloadConfig, PayloadRequest } from 'payload';
import type { StripePluginConfig } from '../types.js';
export declare const stripeWebhooks: (args: {
    config: PayloadConfig;
    pluginConfig: StripePluginConfig;
    req: PayloadRequest;
}) => Promise<any>;
//# sourceMappingURL=webhooks.d.ts.map