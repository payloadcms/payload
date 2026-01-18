import type { CollectionConfig, GlobalConfig, LivePreviewConfig, LivePreviewURLType, Operation, PayloadRequest, SanitizedConfig } from 'payload';
export declare const getLivePreviewConfig: ({ collectionConfig, config, globalConfig, isLivePreviewEnabled, }: {
    collectionConfig?: CollectionConfig;
    config: SanitizedConfig;
    globalConfig?: GlobalConfig;
    isLivePreviewEnabled: boolean;
}) => {
    breakpoints?: {
        height: number | string;
        label: string;
        name: string;
        width: number | string;
    }[];
    url?: ((args: {
        collectionConfig?: import("payload").SanitizedCollectionConfig;
        data: Record<string, any>;
        globalConfig?: import("payload").SanitizedGlobalConfig;
        locale: import("payload").Locale;
        payload: import("payload").Payload;
        req: PayloadRequest;
    }) => LivePreviewURLType | Promise<LivePreviewURLType>) | LivePreviewURLType;
    collections?: string[];
    globals?: string[];
};
/**
 * Multi-level check to determine whether live preview is enabled on a collection or global.
 * For example, live preview can be enabled at both the root config level, or on the entity's config.
 * If a collectionConfig/globalConfig is provided, checks if it is enabled at the root level,
 * or on the entity's own config.
 */
export declare const isLivePreviewEnabled: ({ collectionConfig, config, globalConfig, }: {
    collectionConfig?: CollectionConfig;
    config: SanitizedConfig;
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
export declare const handleLivePreview: ({ collectionSlug, config, data, globalSlug, operation, req, }: {
    collectionSlug?: string;
    config: SanitizedConfig;
    data: Record<string, unknown>;
    globalSlug?: string;
    operation?: Operation;
    req: PayloadRequest;
}) => Promise<{
    isLivePreviewEnabled?: boolean;
    livePreviewConfig?: LivePreviewConfig;
    livePreviewURL?: LivePreviewURLType;
}>;
//# sourceMappingURL=handleLivePreview.d.ts.map