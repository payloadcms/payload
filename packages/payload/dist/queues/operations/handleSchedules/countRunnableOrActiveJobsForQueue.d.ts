import type { PayloadRequest } from '../../../types/index.js';
import type { TaskType } from '../../config/types/taskTypes.js';
import type { WorkflowTypes } from '../../config/types/workflowTypes.js';
/**
 * Gets all queued jobs that can be run. This means they either:
 * - failed but do not have a definitive error => can be retried
 * - are currently processing
 * - have not been started yet
 */
export declare function countRunnableOrActiveJobsForQueue({ onlyScheduled, queue, req, taskSlug, workflowSlug, }: {
    /**
     * If true, this counts only jobs that have been created through the scheduling system.
     *
     * @default false
     */
    onlyScheduled?: boolean;
    queue: string;
    req: PayloadRequest;
    taskSlug?: TaskType;
    workflowSlug?: WorkflowTypes;
}): Promise<number>;
//# sourceMappingURL=countRunnableOrActiveJobsForQueue.d.ts.map