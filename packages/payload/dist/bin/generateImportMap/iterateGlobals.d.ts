import type { SanitizedConfig } from '../../config/types.js';
import type { SanitizedGlobalConfig } from '../../globals/config/types.js';
import type { AddToImportMap, Imports, InternalImportMap } from './index.js';
export declare function iterateGlobals({ addToImportMap, baseDir, config, globals, importMap, imports, }: {
    addToImportMap: AddToImportMap;
    baseDir: string;
    config: SanitizedConfig;
    globals: SanitizedGlobalConfig[];
    importMap: InternalImportMap;
    imports: Imports;
}): void;
//# sourceMappingURL=iterateGlobals.d.ts.map