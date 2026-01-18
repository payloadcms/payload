import type { BaseJob, RunningJobFromTask } from './config/types/workflowTypes.js';
import { type Job, type Payload, type PayloadRequest, type Sort, type TypedJobs, type Where } from '../index.js';
import { type HandleSchedulesResult } from './operations/handleSchedules/index.js';
import { runJobs } from './operations/runJobs/index.js';
export type RunJobsSilent = {
    error?: boolean;
    info?: boolean;
} | boolean;
export declare const getJobsLocalAPI: (payload: Payload) => {
    handleSchedules: (args?: {
        /**
         * If you want to schedule jobs from all queues, set this to true.
         * If you set this to true, the `queue` property will be ignored.
         *
         * @default false
         */
        allQueues?: boolean;
        /**
         * If you want to only schedule jobs that are set to schedule in a specific queue, set this to the queue name.
         *
         * @default jobs from the `default` queue will be executed.
         */
        queue?: string;
        req?: PayloadRequest;
    }) => Promise<HandleSchedulesResult>;
    queue: <TTaskOrWorkflowSlug extends keyof TypedJobs["tasks"] | keyof TypedJobs["workflows"]>(args: {
        input: TypedJobs["tasks"][TTaskOrWorkflowSlug]["input"];
        meta?: BaseJob["meta"];
        /**
         * If set to false, access control as defined in jobsConfig.access.queue will be run.
         * By default, this is true and no access control will be run.
         * If you set this to false and do not have jobsConfig.access.queue defined, the default access control will be
         * run (which is a function that returns `true` if the user is logged in).
         *
         * @default true
         */
        overrideAccess?: boolean;
        /**
         * The queue to add the job to.
         * If not specified, the job will be added to the default queue.
         *
         * @default 'default'
         */
        queue?: string;
        req?: PayloadRequest;
        task: TTaskOrWorkflowSlug extends keyof TypedJobs["tasks"] ? TTaskOrWorkflowSlug : never;
        waitUntil?: Date;
        workflow?: never;
    } | {
        input: TypedJobs["workflows"][TTaskOrWorkflowSlug]["input"];
        meta?: BaseJob["meta"];
        /**
         * If set to false, access control as defined in jobsConfig.access.queue will be run.
         * By default, this is true and no access control will be run.
         * If you set this to false and do not have jobsConfig.access.queue defined, the default access control will be
         * run (which is a function that returns `true` if the user is logged in).
         *
         * @default true
         */
        overrideAccess?: boolean;
        /**
         * The queue to add the job to.
         * If not specified, the job will be added to the default queue.
         *
         * @default 'default'
         */
        queue?: string;
        req?: PayloadRequest;
        task?: never;
        waitUntil?: Date;
        workflow: TTaskOrWorkflowSlug extends keyof TypedJobs["workflows"] ? TTaskOrWorkflowSlug : never;
    }) => Promise<TTaskOrWorkflowSlug extends keyof TypedJobs["workflows"] ? Job<TTaskOrWorkflowSlug> : RunningJobFromTask<TTaskOrWorkflowSlug>>;
    run: (args?: {
        /**
         * If you want to run jobs from all queues, set this to true.
         * If you set this to true, the `queue` property will be ignored.
         *
         * @default false
         */
        allQueues?: boolean;
        /**
         * The maximum number of jobs to run in this invocation
         *
         * @default 10
         */
        limit?: number;
        /**
         * If set to false, access control as defined in jobsConfig.access.run will be run.
         * By default, this is true and no access control will be run.
         * If you set this to false and do not have jobsConfig.access.run defined, the default access control will be
         * run (which is a function that returns `true` if the user is logged in).
         *
         * @default true
         */
        overrideAccess?: boolean;
        /**
         * Adjust the job processing order using a Payload sort string.
         *
         * FIFO would equal `createdAt` and LIFO would equal `-createdAt`.
         */
        processingOrder?: Sort;
        /**
         * If you want to run jobs from a specific queue, set this to the queue name.
         *
         * @default jobs from the `default` queue will be executed.
         */
        queue?: string;
        req?: PayloadRequest;
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
    }) => Promise<ReturnType<typeof runJobs>>;
    runByID: (args: {
        id: number | string;
        /**
         * If set to false, access control as defined in jobsConfig.access.run will be run.
         * By default, this is true and no access control will be run.
         * If you set this to false and do not have jobsConfig.access.run defined, the default access control will be
         * run (which is a function that returns `true` if the user is logged in).
         *
         * @default true
         */
        overrideAccess?: boolean;
        req?: PayloadRequest;
        /**
         * If set to true, the job system will not log any output to the console (for both info and error logs).
         * Can be an option for more granular control over logging.
         *
         * This will not automatically affect user-configured logs (e.g. if you call `console.log` or `payload.logger.info` in your job code).
         *
         * @default false
         */
        silent?: RunJobsSilent;
    }) => Promise<ReturnType<typeof runJobs>>;
    cancel: (args: {
        /**
         * If set to false, access control as defined in jobsConfig.access.cancel will be run.
         * By default, this is true and no access control will be run.
         * If you set this to false and do not have jobsConfig.access.cancel defined, the default access control will be
         * run (which is a function that returns `true` if the user is logged in).
         *
         * @default true
         */
        overrideAccess?: boolean;
        queue?: string;
        req?: PayloadRequest;
        where: Where;
    }) => Promise<void>;
    cancelByID: (args: {
        id: number | string;
        /**
         * If set to false, access control as defined in jobsConfig.access.cancel will be run.
         * By default, this is true and no access control will be run.
         * If you set this to false and do not have jobsConfig.access.cancel defined, the default access control will be
         * run (which is a function that returns `true` if the user is logged in).
         *
         * @default true
         */
        overrideAccess?: boolean;
        req?: PayloadRequest;
    }) => Promise<void>;
};
//# sourceMappingURL=localAPI.d.ts.map