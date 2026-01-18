import type { AdminConfig, CollectionConfigUpdates, DatabaseConfig, GeneralConfig, PluginUpdates } from '../../types.js';
/**
 * Adds a collection to the payload.config.ts file
 */
export declare function addCollectionToConfig(content: string, collectionName: string): string;
/**
 * Removes a collection from the payload.config.ts file
 */
export declare function removeCollectionFromConfig(content: string, collectionName: string): string;
/**
 * Updates admin configuration in payload.config.ts
 */
export declare function updateAdminConfig(content: string, adminConfig: AdminConfig): string;
/**
 * Updates database configuration in payload.config.ts
 */
export declare function updateDatabaseConfig(content: string, databaseConfig: DatabaseConfig): string;
/**
 * Updates plugins configuration in payload.config.ts
 */
export declare function updatePluginsConfig(content: string, pluginUpdates: PluginUpdates): string;
/**
 * Updates general configuration options in payload.config.ts
 */
export declare function updateGeneralConfig(content: string, generalConfig: GeneralConfig): string;
/**
 * Updates collection-level configuration in a collection file
 */
export declare function updateCollectionConfig(content: string, updates: CollectionConfigUpdates, collectionName: string): string;
//# sourceMappingURL=config.d.ts.map