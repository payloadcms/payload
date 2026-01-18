import type { CollectionConfig, Config } from 'payload';
import type { ImportExportPluginConfig } from '../types.js';
export type PluginCollectionsResult = {
    /**
     * Map from target collection slug to the export collection slug to use for it.
     * Only contains entries for collections with custom export collection overrides.
     */
    customExportSlugMap: Map<string, string>;
    /**
     * Map from target collection slug to the import collection slug to use for it.
     * Only contains entries for collections with custom import collection overrides.
     */
    customImportSlugMap: Map<string, string>;
    /**
     * All export collections (base + any per-collection overrides)
     */
    exportCollections: CollectionConfig[];
    /**
     * All import collections (base + any per-collection overrides)
     */
    importCollections: CollectionConfig[];
};
/**
 * Processes the plugin config and returns export/import collections.
 *
 * - Creates the base export and import collections
 * - Applies top-level overrideExportCollection/overrideImportCollection if provided
 * - For each collection in `pluginConfig.collections` that has a function override
 *   for `export` or `import`, applies the override to create customized collections
 *
 * @param config - The Payload config
 * @param pluginConfig - The import/export plugin config
 * @returns Object containing arrays of export and import collections
 */
export declare const getPluginCollections: ({ config, pluginConfig, }: {
    config: Config;
    pluginConfig: ImportExportPluginConfig;
}) => Promise<PluginCollectionsResult>;
//# sourceMappingURL=getPluginCollections.d.ts.map