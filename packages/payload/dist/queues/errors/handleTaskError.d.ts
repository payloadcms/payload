import type { PayloadRequest } from '../../index.js';
import type { RunJobsSilent } from '../localAPI.js';
import type { UpdateJobFunction } from '../operations/runJobs/runJob/getUpdateJobFunction.js';
import type { TaskError } from './index.js';
export declare function handleTaskError({ error, req, silent, updateJob, }: {
    error: TaskError;
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
//# sourceMappingURL=handleTaskError.d.ts.map