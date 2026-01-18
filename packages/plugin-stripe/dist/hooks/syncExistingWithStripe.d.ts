import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload';
import type { StripePluginConfig } from '../types.js';
type HookArgsWithCustomCollection = {
    collection: CollectionConfig;
} & Omit<Parameters<CollectionBeforeChangeHook>[0], 'collection'>;
export type CollectionBeforeChangeHookWithArgs = (args: {
    collection?: CollectionConfig;
    pluginConfig?: StripePluginConfig;
} & HookArgsWithCustomCollection) => Promise<Partial<any>>;
export declare const syncExistingWithStripe: CollectionBeforeChangeHookWithArgs;
export {};
//# sourceMappingURL=syncExistingWithStripe.d.ts.map