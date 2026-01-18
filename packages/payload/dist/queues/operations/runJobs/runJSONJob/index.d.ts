import type { Job } from '../../../../index.js';
import type { PayloadRequest } from '../../../../types/index.js';
import type { WorkflowJSON } from '../../../config/types/workflowJSONTypes.js';
import type { WorkflowConfig } from '../../../config/types/workflowTypes.js';
import type { RunJobsSilent } from '../../../localAPI.js';
import type { UpdateJobFunction } from '../runJob/getUpdateJobFunction.js';
import type { JobRunStatus } from '../runJob/index.js';
type Args = {
    job: Job;
    req: PayloadRequest;
    /**
     * If set to true, the job system will not log any output to the console (for both info and error logs).
     * Can be an option for more granular control over logging.
     *
     * This will not automatically affect user-configured logs (e.g. if you call `console.log` or `payload.logger.info` in your job code).
     *
     * @default false
     */
    silent?: RunJobsSilent;
    updateJob: UpdateJobFunction;
    workflowConfig: WorkflowConfig;
    workflowHandler: WorkflowJSON;
};
export type RunJSONJobResult = {
    status: JobRunStatus;
};
export declare const runJSONJob: ({ job, req, silent, updateJob, workflowConfig, workflowHandler, }: Args) => Promise<RunJSONJobResult>;
export {};
//# sourceMappingURL=index.d.ts.map