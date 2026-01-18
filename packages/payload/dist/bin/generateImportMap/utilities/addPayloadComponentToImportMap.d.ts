import type { PayloadComponent } from '../../../config/types.js';
import type { Imports, InternalImportMap } from '../index.js';
/**
 * Adds a payload component to the import map.
 */
export declare function addPayloadComponentToImportMap({ importMap, importMapToBaseDirPath, imports, payloadComponent, }: {
    importMap: InternalImportMap;
    importMapToBaseDirPath: string;
    imports: Imports;
    payloadComponent: PayloadComponent;
}): {
    path: string;
    specifier: string;
} | null;
//# sourceMappingURL=addPayloadComponentToImportMap.d.ts.map