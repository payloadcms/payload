import type { Job } from '../../index.js';
import type { RetryConfig } from '../config/types/taskTypes.js';
/**
 * Assuming there is no task that has already reached max retries,
 * this function determines if the workflow should retry the job
 * and if so, when it should retry.
 */
export declare function getWorkflowRetryBehavior({ job, retriesConfig, }: {
    job: Job;
    retriesConfig?: number | RetryConfig;
}): {
    hasFinalError: false;
    maxWorkflowRetries?: number;
    waitUntil?: Date;
} | {
    hasFinalError: true;
    maxWorkflowRetries?: number;
    waitUntil?: Date;
};
//# sourceMappingURL=getWorkflowRetryBehavior.d.ts.map