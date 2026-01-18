import type { Job, SingleTaskStatus, WorkflowConfig } from '../../index.js';
import type { RetryConfig, TaskConfig } from '../config/types/taskTypes.js';
import type { TaskParent } from '../operations/runJobs/runJob/getRunTaskFunction.js';
export type TaskErrorArgs = {
    executedAt: Date;
    input?: object;
    job: Job;
    message: string;
    output?: object;
    parent?: TaskParent;
    retriesConfig: RetryConfig;
    taskConfig?: TaskConfig<string>;
    taskID: string;
    taskSlug: string;
    taskStatus: null | SingleTaskStatus<string>;
    workflowConfig: WorkflowConfig;
};
export type WorkflowErrorArgs = {
    job: Job;
    message: string;
    workflowConfig: WorkflowConfig;
};
export declare class TaskError extends Error {
    args: TaskErrorArgs;
    constructor(args: TaskErrorArgs);
}
export declare class WorkflowError extends Error {
    args: WorkflowErrorArgs;
    constructor(args: WorkflowErrorArgs);
}
/**
 * Throw this error from within a task or workflow handler to cancel the job.
 * Unlike failing a job (e.g. by throwing any other error), a cancelled job will not be retried.
 */
export declare class JobCancelledError extends Error {
    constructor(message: string);
}
//# sourceMappingURL=index.d.ts.map