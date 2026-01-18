import type { CollectionAfterDeleteHook, CollectionConfig } from 'payload';
import type { StripePluginConfig } from '../types.js';
type HookArgsWithCustomCollection = {
    collection: CollectionConfig;
} & Omit<Parameters<CollectionAfterDeleteHook>[0], 'collection'>;
export type CollectionAfterDeleteHookWithArgs = (args: {
    collection?: CollectionConfig;
    pluginConfig?: StripePluginConfig;
} & HookArgsWithCustomCollection) => Promise<void>;
export declare const deleteFromStripe: CollectionAfterDeleteHookWithArgs;
export {};
//# sourceMappingURL=deleteFromStripe.d.ts.map