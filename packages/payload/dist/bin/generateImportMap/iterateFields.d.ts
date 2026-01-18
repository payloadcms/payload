import type { SanitizedConfig } from '../../config/types.js';
import type { Block, Field, Tab } from '../../fields/config/types.js';
import type { AddToImportMap, Imports, InternalImportMap } from './index.js';
export declare function genImportMapIterateFields({ addToImportMap, baseDir, config, fields, importMap, imports, }: {
    addToImportMap: AddToImportMap;
    baseDir: string;
    config: SanitizedConfig;
    fields: Block[] | Field[] | Tab[];
    importMap: InternalImportMap;
    imports: Imports;
}): void;
//# sourceMappingURL=iterateFields.d.ts.map