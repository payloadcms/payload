import type { Job, TaskHandlerResult, TypedJobs } from '../../../index.js';
import type { RetryConfig, TaskHandlerArgsNoInput } from './taskTypes.js';
export type WorkflowStep<TTaskSlug extends keyof TypedJobs['tasks'], TWorkflowSlug extends false | keyof TypedJobs['workflows'] = false> = {
    /**
     * If this step is completed, the workflow will be marked as completed
     */
    completesJob?: boolean;
    condition?: (args: {
        job: Job<TWorkflowSlug>;
    }) => boolean;
    /**
     * Each task needs to have a unique ID to track its status
     */
    id: string;
    /**
     * Specify the number of times that this workflow should be retried if it fails for any reason.
     *
     * @default By default, workflows are not retried and `retries` is `0`.
     */
    retries?: number | RetryConfig;
} & ({
    inlineTask?: (args: TWorkflowSlug extends keyof TypedJobs['workflows'] ? TaskHandlerArgsNoInput<TypedJobs['workflows'][TWorkflowSlug]['input']> : TaskHandlerArgsNoInput) => Promise<TaskHandlerResult<TTaskSlug>> | TaskHandlerResult<TTaskSlug>;
} | {
    input: (args: {
        job: Job<TWorkflowSlug>;
    }) => TypedJobs['tasks'][TTaskSlug]['input'];
    task: TTaskSlug;
});
type AllWorkflowSteps<TWorkflowSlug extends false | keyof TypedJobs['workflows'] = false> = {
    [TTaskSlug in keyof TypedJobs['tasks']]: WorkflowStep<TTaskSlug, TWorkflowSlug>;
}[keyof TypedJobs['tasks']];
export type WorkflowJSON<TWorkflowSlug extends false | keyof TypedJobs['workflows'] = false> = Array<AllWorkflowSteps<TWorkflowSlug>>;
export {};
//# sourceMappingURL=workflowJSONTypes.d.ts.map