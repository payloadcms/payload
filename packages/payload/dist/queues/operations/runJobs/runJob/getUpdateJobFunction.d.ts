import type { Job } from '../../../../index.js';
import type { PayloadRequest } from '../../../../types/index.js';
export type UpdateJobFunction = (jobData: Partial<Job>) => Promise<Job>;
/**
 * Helper for updating a job that does the following, additionally to updating the job:
 * - Merges incoming data from the updated job into the original job object
 * - Handles job cancellation by throwing a `JobCancelledError` if the job was cancelled.
 */
export declare function getUpdateJobFunction(job: Job, req: PayloadRequest): UpdateJobFunction;
//# sourceMappingURL=getUpdateJobFunction.d.ts.map