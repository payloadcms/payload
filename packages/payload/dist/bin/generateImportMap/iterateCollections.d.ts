import type { SanitizedCollectionConfig } from '../../collections/config/types.js';
import type { SanitizedConfig } from '../../config/types.js';
import type { AddToImportMap, Imports, InternalImportMap } from './index.js';
export declare function iterateCollections({ addToImportMap, baseDir, collections, config, importMap, imports, }: {
    addToImportMap: AddToImportMap;
    baseDir: string;
    collections: SanitizedCollectionConfig[];
    config: SanitizedConfig;
    importMap: InternalImportMap;
    imports: Imports;
}): void;
//# sourceMappingURL=iterateCollections.d.ts.map