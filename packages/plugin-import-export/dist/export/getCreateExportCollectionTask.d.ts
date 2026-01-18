import type { Config, TaskConfig } from 'payload';
import type { Export } from './createExport.js';
/**
 * Export input type for job queue serialization.
 * When exports are queued as jobs, the user must be serialized as an ID string or number
 * along with the collection name so it can be rehydrated when the job runs.
 */
export type ExportJobInput = {
    user: number | string;
    userCollection: string;
} & Export;
export declare const getCreateCollectionExportTask: (config: Config) => TaskConfig<{
    input: ExportJobInput;
    output: object;
}>;
//# sourceMappingURL=getCreateExportCollectionTask.d.ts.map