import { jobStatsGlobalSlug } from '../../config/global.js';
import { getCurrentDate } from '../../utilities/getCurrentDate.js';
export const defaultAfterSchedule = async ({ jobStats, queueable, req })=>{
    const existingQueuesConfig = jobStats?.stats?.scheduledRuns?.queues?.[queueable.scheduleConfig.queue] || {};
    const queueConfig = {
        ...existingQueuesConfig
    };
    if (queueable.taskConfig) {
        ;
        (queueConfig.tasks ??= {})[queueable.taskConfig.slug] = {
            lastScheduledRun: getCurrentDate().toISOString()
        };
    } else if (queueable.workflowConfig) {
        ;
        (queueConfig.workflows ??= {})[queueable.workflowConfig.slug] = {
            lastScheduledRun: getCurrentDate().toISOString()
        };
    }
    // Add to payload-jobs-stats global regardless of the status
    if (jobStats) {
        await req.payload.db.updateGlobal({
            slug: jobStatsGlobalSlug,
            data: {
                ...jobStats || {},
                stats: {
                    ...jobStats?.stats || {},
                    scheduledRuns: {
                        ...jobStats?.stats?.scheduledRuns || {},
                        queues: {
                            ...jobStats?.stats?.scheduledRuns?.queues || {},
                            [queueable.scheduleConfig.queue]: queueConfig
                        }
                    }
                },
                updatedAt: new Date().toISOString()
            },
            req,
            returning: false
        });
    } else {
        await req.payload.db.createGlobal({
            slug: jobStatsGlobalSlug,
            data: {
                createdAt: getCurrentDate().toISOString(),
                stats: {
                    scheduledRuns: {
                        queues: {
                            [queueable.scheduleConfig.queue]: queueConfig
                        }
                    }
                }
            },
            req,
            returning: false
        });
    }
};

//# sourceMappingURL=defaultAfterSchedule.js.map