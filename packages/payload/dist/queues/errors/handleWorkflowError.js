import { getCurrentDate } from '../utilities/getCurrentDate.js';
import { getWorkflowRetryBehavior } from './getWorkflowRetryBehavior.js';
/**
 * This is called if a workflow catches an error. It determines if it's a final error
 * or not and handles logging.
 * A Workflow error = error that happens anywhere in between running tasks.
 *
 * This function assumes that the error is not a TaskError, but a WorkflowError. If a task errors,
 * only a TaskError should be thrown, not a WorkflowError.
 */ export async function handleWorkflowError({ error, req, silent = false, updateJob }) {
    const { job, workflowConfig } = error.args;
    const errorJSON = {
        name: error.name,
        cancelled: Boolean('cancelled' in error && error.cancelled),
        message: error.message,
        stack: error.stack
    };
    const { hasFinalError, maxWorkflowRetries, waitUntil } = getWorkflowRetryBehavior({
        job,
        retriesConfig: workflowConfig.retries
    });
    if (!hasFinalError) {
        if (job.waitUntil) {
            // Check if waitUntil is in the past
            const waitUntil = new Date(job.waitUntil);
            if (waitUntil < getCurrentDate()) {
                // Outdated waitUntil, remove it
                delete job.waitUntil;
            }
        }
        // Update job's waitUntil only if this waitUntil is later than the current one
        if (waitUntil && (!job.waitUntil || waitUntil > new Date(job.waitUntil))) {
            job.waitUntil = waitUntil.toISOString();
        }
    }
    const jobLabel = job.workflowSlug || `Task: ${job.taskSlug}`;
    if (!silent || typeof silent === 'object' && !silent.error) {
        req.payload.logger.error({
            err: error,
            msg: `Error running job ${jobLabel} id: ${job.id} attempt ${job.totalTried + 1}${maxWorkflowRetries !== undefined ? '/' + (maxWorkflowRetries + 1) : ''}`
        });
    }
    // Tasks update the job if they error - but in case there is an unhandled error (e.g. in the workflow itself, not in a task)
    // we need to ensure the job is updated to reflect the error
    await updateJob({
        error: errorJSON,
        hasError: hasFinalError,
        processing: false,
        totalTried: (job.totalTried ?? 0) + 1,
        waitUntil: job.waitUntil
    });
    return {
        hasFinalError
    };
}

//# sourceMappingURL=handleWorkflowError.js.map