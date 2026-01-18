import type { DatabaseAdapter, StorageAdapter } from './types.js';
type PackageJsonTransformOptions = {
    databaseAdapter?: DatabaseAdapter;
    packageName?: string;
    removeSharp?: boolean;
    storageAdapter?: StorageAdapter;
};
/**
 * Main orchestration function
 */
export declare function updatePackageJson(filePath: string, options: PackageJsonTransformOptions): void;
export {};
//# sourceMappingURL=package-json.d.ts.map