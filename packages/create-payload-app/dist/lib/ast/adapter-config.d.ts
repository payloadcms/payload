/**
 * Centralized adapter configuration
 * Shared across all AST transformation and test files
 */
import type { DatabaseAdapter, StorageAdapter } from './types.js';
export type DatabaseAdapterConfig = {
    adapterName: string;
    configTemplate: (envVar: string) => string;
    packageName: string;
};
export type StorageAdapterConfig = {
    adapterName: null | string;
    configTemplate: () => null | string;
    packageName: null | string;
};
/**
 * Database adapter configurations
 */
export declare const DB_ADAPTER_CONFIG: Record<DatabaseAdapter, DatabaseAdapterConfig>;
/**
 * Storage adapter configurations
 */
export declare const STORAGE_ADAPTER_CONFIG: Record<StorageAdapter, StorageAdapterConfig>;
/**
 * Helper to get database adapter package name
 */
export declare function getDbPackageName(adapter: DatabaseAdapter): string;
/**
 * Helper to get database adapter name
 */
export declare function getDbAdapterName(adapter: DatabaseAdapter): string;
/**
 * Helper to get storage adapter package name
 */
export declare function getStoragePackageName(adapter: StorageAdapter): null | string;
/**
 * Helper to get storage adapter name
 */
export declare function getStorageAdapterName(adapter: StorageAdapter): null | string;
//# sourceMappingURL=adapter-config.d.ts.map