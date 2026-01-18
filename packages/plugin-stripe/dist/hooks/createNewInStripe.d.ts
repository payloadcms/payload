import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload';
import type { StripePluginConfig } from '../types.js';
type HookArgsWithCustomCollection = {
    collection: CollectionConfig;
} & Omit<Parameters<CollectionBeforeValidateHook>[0], 'collection'>;
export type CollectionBeforeValidateHookWithArgs = (args: {
    collection?: CollectionConfig;
    pluginConfig?: StripePluginConfig;
} & HookArgsWithCustomCollection) => Promise<Partial<any>>;
export declare const createNewInStripe: CollectionBeforeValidateHookWithArgs;
export {};
//# sourceMappingURL=createNewInStripe.d.ts.map