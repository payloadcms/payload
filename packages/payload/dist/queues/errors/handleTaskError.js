import ObjectIdImport from 'bson-objectid';
import { getCurrentDate } from '../utilities/getCurrentDate.js';
import { calculateBackoffWaitUntil } from './calculateBackoffWaitUntil.js';
import { getWorkflowRetryBehavior } from './getWorkflowRetryBehavior.js';
const ObjectId = 'default' in ObjectIdImport ? ObjectIdImport.default : ObjectIdImport;
export async function handleTaskError({ error, req, silent = false, updateJob }) {
    const { executedAt, input, job, output, parent, retriesConfig, taskConfig, taskID, taskSlug, taskStatus, workflowConfig } = error.args;
    if (taskConfig?.onFail) {
        await taskConfig.onFail({
            input,
            job,
            req,
            taskStatus
        });
    }
    const errorJSON = {
        name: error.name,
        cancelled: Boolean('cancelled' in error && error.cancelled),
        message: error.message,
        stack: error.stack
    };
    const currentDate = getCurrentDate();
    if (job.waitUntil) {
        // Check if waitUntil is in the past
        const waitUntil = new Date(job.waitUntil);
        if (waitUntil < currentDate) {
            // Outdated waitUntil, remove it
            delete job.waitUntil;
        }
    }
    let maxRetries = 0;
    if (retriesConfig?.attempts === undefined || retriesConfig?.attempts === null) {
        // Inherit retries from workflow config, if they are undefined and the workflow config has retries configured
        if (workflowConfig.retries !== undefined && workflowConfig.retries !== null) {
            maxRetries = typeof workflowConfig.retries === 'object' ? typeof workflowConfig.retries.attempts === 'number' ? workflowConfig.retries.attempts : 0 : workflowConfig.retries;
        } else {
            maxRetries = 0;
        }
    } else {
        maxRetries = retriesConfig.attempts;
    }
    const taskLogToPush = {
        id: new ObjectId().toHexString(),
        completedAt: currentDate.toISOString(),
        error: errorJSON,
        executedAt: executedAt.toISOString(),
        input,
        output: output ?? {},
        parent: req.payload.config.jobs.addParentToTaskLog ? parent : undefined,
        state: 'failed',
        taskID,
        taskSlug
    };
    if (!taskStatus?.complete && (taskStatus?.totalTried ?? 0) >= maxRetries) {
        /**
     * Task reached max retries => workflow will not retry
     */ await updateJob({
            error: errorJSON,
            hasError: true,
            log: {
                $push: taskLogToPush
            },
            processing: false,
            totalTried: (job.totalTried ?? 0) + 1,
            waitUntil: job.waitUntil
        });
        if (!silent || typeof silent === 'object' && !silent.error) {
            req.payload.logger.error({
                err: error,
                job,
                msg: `Error running task ${taskID}. Attempt ${job.totalTried} - max retries reached`,
                taskSlug
            });
        }
        return {
            hasFinalError: true
        };
    }
    /**
   * Task can retry:
   * - If workflow can retry, allow it to retry
   * - If workflow reached max retries, do not retry and set final error
   */ // First set task waitUntil - if the workflow waitUntil is later, it will be updated later
    const taskWaitUntil = calculateBackoffWaitUntil({
        retriesConfig,
        totalTried: taskStatus?.totalTried ?? 0
    });
    // Update job's waitUntil only if this waitUntil is later than the current one
    if (!job.waitUntil || taskWaitUntil > new Date(job.waitUntil)) {
        job.waitUntil = taskWaitUntil.toISOString();
    }
    const { hasFinalError, maxWorkflowRetries, waitUntil } = getWorkflowRetryBehavior({
        job,
        retriesConfig: workflowConfig.retries
    });
    if (!silent || typeof silent === 'object' && !silent.error) {
        req.payload.logger.error({
            err: error,
            job,
            msg: `Error running task ${taskID}. Attempt ${job.totalTried + 1}${maxWorkflowRetries !== undefined ? '/' + (maxWorkflowRetries + 1) : ''}`,
            taskSlug
        });
    }
    // Update job's waitUntil only if this waitUntil is later than the current one
    if (waitUntil && (!job.waitUntil || waitUntil > new Date(job.waitUntil))) {
        job.waitUntil = waitUntil.toISOString();
    }
    // Tasks update the job if they error - but in case there is an unhandled error (e.g. in the workflow itself, not in a task)
    // we need to ensure the job is updated to reflect the error
    await updateJob({
        error: hasFinalError ? errorJSON : undefined,
        hasError: hasFinalError,
        log: {
            $push: taskLogToPush
        },
        processing: false,
        totalTried: (job.totalTried ?? 0) + 1,
        waitUntil: job.waitUntil
    });
    return {
        hasFinalError
    };
}

//# sourceMappingURL=handleTaskError.js.map