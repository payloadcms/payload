import type { Endpoint } from '../../config/types.js';
import type { SanitizedJobsConfig } from '../config/types/index.js';
/**
 * /api/payload-jobs/run endpoint
 *
 * This endpoint is GET instead of POST to allow it to be used in a Vercel Cron.
 */
export declare const runJobsEndpoint: Endpoint;
export declare const configHasJobs: (jobsConfig: SanitizedJobsConfig) => boolean;
//# sourceMappingURL=run.d.ts.map