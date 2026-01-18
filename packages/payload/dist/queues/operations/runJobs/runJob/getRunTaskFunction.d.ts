import type { Job } from '../../../../index.js';
import type { PayloadRequest } from '../../../../types/index.js';
import type { RunInlineTaskFunction, RunTaskFunctions } from '../../../config/types/taskTypes.js';
import type { WorkflowConfig } from '../../../config/types/workflowTypes.js';
import type { UpdateJobFunction } from './getUpdateJobFunction.js';
export type TaskParent = {
    taskID: string;
    taskSlug: string;
};
export declare const getRunTaskFunction: <TIsInline extends boolean>(job: Job, workflowConfig: WorkflowConfig, req: PayloadRequest, isInline: TIsInline, updateJob: UpdateJobFunction, parent?: TaskParent) => TIsInline extends true ? RunInlineTaskFunction : RunTaskFunctions;
//# sourceMappingURL=getRunTaskFunction.d.ts.map