import type { Config, TaskConfig } from 'payload';
import type { Import } from './createImport.js';
export type ImportTaskInput = {
    defaultVersionStatus?: 'draft' | 'published';
    importId?: string;
    importsCollection?: string;
    user?: string;
} & Import;
export declare const getCreateCollectionImportTask: (config: Config) => TaskConfig<{
    input: ImportTaskInput;
    output: object;
}>;
//# sourceMappingURL=getCreateImportCollectionTask.d.ts.map