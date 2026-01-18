import type { CollectionSlugMap, SanitizedEcommercePluginConfig } from '../types/index.js';
type Props = {
    enableVariants?: boolean;
    sanitizedPluginConfig: SanitizedEcommercePluginConfig;
};
/**
 * Generates a map of collection slugs based on the sanitized plugin configuration.
 * Takes into consideration any collection overrides provided in the plugin.
 * Variant-related slugs are only included when enableVariants is true.
 */
export declare const getCollectionSlugMap: ({ enableVariants, sanitizedPluginConfig, }: Props) => CollectionSlugMap;
export {};
//# sourceMappingURL=getCollectionSlugMap.d.ts.map