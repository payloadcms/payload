import { countRunnableOrActiveJobsForQueue } from './countRunnableOrActiveJobsForQueue.js';
export const defaultBeforeSchedule = async ({ queueable, req })=>{
    // All tasks in that queue that are either currently processing or can be run
    const runnableOrActiveJobsForQueue = await countRunnableOrActiveJobsForQueue({
        onlyScheduled: true,
        queue: queueable.scheduleConfig.queue,
        req,
        taskSlug: queueable.taskConfig?.slug,
        workflowSlug: queueable.workflowConfig?.slug
    });
    return {
        input: {},
        shouldSchedule: runnableOrActiveJobsForQueue === 0,
        waitUntil: queueable.waitUntil
    };
};

//# sourceMappingURL=defaultBeforeSchedule.js.map