import type { CollectionConfig, Field } from 'payload';
import type { SanitizedStripePluginConfig } from '../types.js';
interface Args {
    collection: CollectionConfig;
    pluginConfig: SanitizedStripePluginConfig;
    syncConfig: {
        stripeResourceType: string;
    };
}
export declare const getFields: ({ collection, pluginConfig, syncConfig }: Args) => Field[];
export {};
//# sourceMappingURL=getFields.d.ts.map