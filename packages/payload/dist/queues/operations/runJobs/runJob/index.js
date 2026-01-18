import { handleTaskError } from '../../../errors/handleTaskError.js';
import { handleWorkflowError } from '../../../errors/handleWorkflowError.js';
import { JobCancelledError, TaskError, WorkflowError } from '../../../errors/index.js';
import { getCurrentDate } from '../../../utilities/getCurrentDate.js';
import { getRunTaskFunction } from './getRunTaskFunction.js';
export const runJob = async ({ job, req, silent, updateJob, workflowConfig, workflowHandler })=>{
    // Run the job
    try {
        await workflowHandler({
            inlineTask: getRunTaskFunction(job, workflowConfig, req, true, updateJob),
            job,
            req,
            tasks: getRunTaskFunction(job, workflowConfig, req, false, updateJob)
        });
    } catch (error) {
        if (error instanceof JobCancelledError) {
            throw error // Job cancellation is handled in a top-level error handler, as higher up code may themselves throw this error
            ;
        }
        if (error instanceof TaskError) {
            const { hasFinalError } = await handleTaskError({
                error,
                req,
                silent,
                updateJob
            });
            return {
                status: hasFinalError ? 'error-reached-max-retries' : 'error'
            };
        }
        const { hasFinalError } = await handleWorkflowError({
            error: error instanceof WorkflowError ? error : new WorkflowError({
                job,
                message: typeof error === 'object' && error && 'message' in error ? error.message : 'An unhandled error occurred',
                workflowConfig
            }),
            req,
            silent,
            updateJob
        });
        return {
            status: hasFinalError ? 'error-reached-max-retries' : 'error'
        };
    }
    // Workflow has completed successfully
    // Do not update the job log here, as that would result in unnecessary db calls when using postgres.
    // Solely updating simple fields here will result in optimized db calls.
    // Job log modifications are already updated at the end of the runTask function.
    await updateJob({
        completedAt: getCurrentDate().toISOString(),
        processing: false,
        totalTried: (job.totalTried ?? 0) + 1
    });
    return {
        status: 'success'
    };
};

//# sourceMappingURL=index.js.map