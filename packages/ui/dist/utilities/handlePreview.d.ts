import { type CollectionConfig, type GlobalConfig, type Operation, type PayloadRequest, type SanitizedConfig } from 'payload';
/**
 * Multi-level check to determine whether live preview is enabled on a collection or global.
 * For example, live preview can be enabled at both the root config level, or on the entity's config.
 * If a collectionConfig/globalConfig is provided, checks if it is enabled at the root level,
 * or on the entity's own config.
 */
export declare const isPreviewEnabled: ({ collectionConfig, globalConfig, }: {
    collectionConfig?: CollectionConfig;
    globalConfig?: GlobalConfig;
}) => boolean;
/**
 * 1. Looks up the relevant live preview config, which could have been enabled:
 *   a. At the root level, e.g. `collections: ['posts']`
 *   b. On the collection or global config, e.g. `admin: { livePreview: { ... } }`
 * 2. Determines if live preview is enabled, and if not, early returns.
 * 3. Merges the config with the root config, if necessary.
 * 4. Executes the `url` function, if necessary.
 *
 * Notice: internal function only. Subject to change at any time. Use at your own risk.
 */
export declare const handlePreview: ({ collectionSlug, config, data, globalSlug, operation, req, }: {
    collectionSlug?: string;
    config: SanitizedConfig;
    data: Record<string, unknown>;
    globalSlug?: string;
    operation?: Operation;
    req: PayloadRequest;
}) => Promise<{
    isPreviewEnabled?: boolean;
    previewURL?: string;
}>;
//# sourceMappingURL=handlePreview.d.ts.map