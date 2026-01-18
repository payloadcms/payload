import type { PayloadRequest } from '../../index.js';
import type { RunJobsSilent } from '../localAPI.js';
import type { UpdateJobFunction } from '../operations/runJobs/runJob/getUpdateJobFunction.js';
import type { WorkflowError } from './index.js';
/**
 * This is called if a workflow catches an error. It determines if it's a final error
 * or not and handles logging.
 * A Workflow error = error that happens anywhere in between running tasks.
 *
 * This function assumes that the error is not a TaskError, but a WorkflowError. If a task errors,
 * only a TaskError should be thrown, not a WorkflowError.
 */
export declare function handleWorkflowError({ error, req, silent, updateJob, }: {
    error: WorkflowError;
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
}): Promise<{
    hasFinalError: boolean;
}>;
//# sourceMappingURL=handleWorkflowError.d.ts.map