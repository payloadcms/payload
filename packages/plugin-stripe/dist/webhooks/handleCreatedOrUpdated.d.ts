import type { SanitizedStripePluginConfig, StripeWebhookHandler } from '../types.js';
type HandleCreatedOrUpdated = (args: {
    resourceType: string;
    syncConfig: SanitizedStripePluginConfig['sync'][0];
} & Parameters<StripeWebhookHandler>[0]) => Promise<void>;
export declare const handleCreatedOrUpdated: HandleCreatedOrUpdated;
export {};
//# sourceMappingURL=handleCreatedOrUpdated.d.ts.map