import type { Job, TaskConfig, WorkflowConfig } from '../../../index.js';
import type { PayloadRequest } from '../../../types/index.js';
import type { Queueable, ScheduleConfig } from '../../config/types/index.js';
import { type JobStats } from '../../config/global.js';
export type HandleSchedulesResult = {
    errored: Queueable[];
    queued: Queueable[];
    skipped: Queueable[];
};
/**
 * On vercel, we cannot auto-schedule jobs using a Cron - instead, we'll use this same endpoint that can
 * also be called from Vercel Cron for auto-running jobs.
 *
 * The benefit of doing it like this instead of a separate endpoint is that we can run jobs immediately
 * after they are scheduled
 */
export declare function handleSchedules({ allQueues, queue: _queue, req, }: {
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
    req: PayloadRequest;
}): Promise<HandleSchedulesResult>;
export declare function checkQueueableTimeConstraints({ queue, scheduleConfig, stats, taskConfig, workflowConfig, }: {
    queue: string;
    scheduleConfig: ScheduleConfig;
    stats: JobStats;
    taskConfig?: TaskConfig;
    workflowConfig?: WorkflowConfig;
}): false | Queueable;
export declare function scheduleQueueable({ queueable, req, stats, }: {
    queueable: Queueable;
    req: PayloadRequest;
    stats: JobStats;
}): Promise<{
    job?: Job<false>;
    status: 'error' | 'skipped' | 'success';
}>;
//# sourceMappingURL=index.d.ts.map