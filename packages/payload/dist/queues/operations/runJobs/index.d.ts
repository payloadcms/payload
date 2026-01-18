import type { PayloadRequest, Sort, Where } from '../../../types/index.js';
import type { RunJobsSilent } from '../../localAPI.js';
import type { RunJobResult } from './runJob/index.js';
export type RunJobsArgs = {
    /**
     * If you want to run jobs from all queues, set this to true.
     * If you set this to true, the `queue` property will be ignored.
     *
     * @default false
     */
    allQueues?: boolean;
    /**
     * ID of the job to run
     */
    id?: number | string;
    /**
     * The maximum number of jobs to run in this invocation
     *
     * @default 10
     */
    limit?: number;
    overrideAccess?: boolean;
    /**
     * Adjust the job processing order
     *
     * FIFO would equal `createdAt` and LIFO would equal `-createdAt`.
     *
     * @default all jobs for all queues will be executed in FIFO order.
     */
    processingOrder?: Sort;
    /**
     * If you want to run jobs from a specific queue, set this to the queue name.
     *
     * @default jobs from the `default` queue will be executed.
     */
    queue?: string;
    req: PayloadRequest;
    /**
     * By default, jobs are run in parallel.
     * If you want to run them in sequence, set this to true.
     */
    sequential?: boolean;
    /**
     * If set to true, the job system will not log any output to the console (for both info and error logs).
     * Can be an option for more granular control over logging.
     *
     * This will not automatically affect user-configured logs (e.g. if you call `console.log` or `payload.logger.info` in your job code).
     *
     * @default false
     */
    silent?: RunJobsSilent;
    where?: Where;
};
export type RunJobsResult = {
    jobStatus?: Record<string, RunJobResult>;
    /**
     * If this is true, there for sure are no jobs remaining, regardless of the limit
     */
    noJobsRemaining?: boolean;
    /**
     * Out of the jobs that were queried & processed (within the set limit), how many are remaining and retryable?
     */
    remainingJobsFromQueried: number;
};
export declare const runJobs: (args: RunJobsArgs) => Promise<RunJobsResult>;
//# sourceMappingURL=index.d.ts.map