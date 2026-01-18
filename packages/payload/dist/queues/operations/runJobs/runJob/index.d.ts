import type { Job } from '../../../../index.js';
import type { PayloadRequest } from '../../../../types/index.js';
import type { WorkflowConfig, WorkflowHandler } from '../../../config/types/workflowTypes.js';
import type { RunJobsSilent } from '../../../localAPI.js';
import type { UpdateJobFunction } from './getUpdateJobFunction.js';
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
    workflowHandler: WorkflowHandler;
};
export type JobRunStatus = 'error' | 'error-reached-max-retries' | 'success';
export type RunJobResult = {
    status: JobRunStatus;
};
export declare const runJob: ({ job, req, silent, updateJob, workflowConfig, workflowHandler, }: Args) => Promise<RunJobResult>;
export {};
//# sourceMappingURL=index.d.ts.map