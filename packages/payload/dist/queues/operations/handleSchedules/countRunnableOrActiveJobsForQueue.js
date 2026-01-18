/**
 * Gets all queued jobs that can be run. This means they either:
 * - failed but do not have a definitive error => can be retried
 * - are currently processing
 * - have not been started yet
 */ export async function countRunnableOrActiveJobsForQueue({ onlyScheduled = false, queue, req, taskSlug, workflowSlug }) {
    const and = [
        {
            queue: {
                equals: queue
            }
        },
        {
            completedAt: {
                exists: false
            }
        },
        {
            error: {
                exists: false
            }
        }
    ];
    if (taskSlug) {
        and.push({
            taskSlug: {
                equals: taskSlug
            }
        });
    } else if (workflowSlug) {
        and.push({
            workflowSlug: {
                equals: workflowSlug
            }
        });
    }
    if (onlyScheduled) {
        and.push({
            'meta.scheduled': {
                equals: true
            }
        });
    }
    const runnableOrActiveJobsForQueue = await req.payload.db.count({
        collection: 'payload-jobs',
        req,
        where: {
            and
        }
    });
    return runnableOrActiveJobsForQueue.totalDocs;
}

//# sourceMappingURL=countRunnableOrActiveJobsForQueue.js.map