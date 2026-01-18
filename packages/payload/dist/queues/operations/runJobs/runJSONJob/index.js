import { handleWorkflowError } from '../../../errors/handleWorkflowError.js';
import { WorkflowError } from '../../../errors/index.js';
import { getCurrentDate } from '../../../utilities/getCurrentDate.js';
import { getRunTaskFunction } from '../runJob/getRunTaskFunction.js';
export const runJSONJob = async ({ job, req, silent = false, updateJob, workflowConfig, workflowHandler })=>{
    const stepsToRun = [];
    for (const step of workflowHandler){
        if ('task' in step) {
            if (job?.taskStatus?.[step.task]?.[step.id]?.complete) {
                continue;
            }
        } else {
            if (job?.taskStatus?.['inline']?.[step.id]?.complete) {
                continue;
            }
        }
        if (step.condition && !step.condition({
            job
        })) {
            continue;
        }
        stepsToRun.push(step);
    }
    const tasks = getRunTaskFunction(job, workflowConfig, req, false, updateJob);
    const inlineTask = getRunTaskFunction(job, workflowConfig, req, true, updateJob);
    // Run the job
    try {
        await Promise.all(stepsToRun.map(async (step)=>{
            if ('task' in step) {
                await tasks[step.task](step.id, {
                    input: step.input ? step.input({
                        job
                    }) : {},
                    retries: step.retries
                });
            } else {
                await inlineTask(step.id, {
                    retries: step.retries,
                    task: step.inlineTask
                });
            }
        }));
    } catch (error) {
        const { hasFinalError } = await handleWorkflowError({
            error: error instanceof WorkflowError ? error : new WorkflowError({
                job,
                message: typeof error === 'object' && error && 'message' in error ? error.message : 'An unhandled error occurred',
                workflowConfig
            }),
            silent,
            req,
            updateJob
        });
        return {
            status: hasFinalError ? 'error-reached-max-retries' : 'error'
        };
    }
    // Check if workflow has completed
    let workflowCompleted = false;
    for (const [slug, map] of Object.entries(job.taskStatus)){
        for (const [id, taskStatus] of Object.entries(map)){
            if (taskStatus.complete) {
                const step = workflowHandler.find((step)=>{
                    if ('task' in step) {
                        return step.task === slug && step.id === id;
                    } else {
                        return step.id === id && slug === 'inline';
                    }
                });
                if (step?.completesJob) {
                    workflowCompleted = true;
                    break;
                }
            }
        }
    }
    if (workflowCompleted) {
        await updateJob({
            completedAt: getCurrentDate().toISOString(),
            processing: false,
            totalTried: (job.totalTried ?? 0) + 1
        });
        return {
            status: 'success'
        };
    } else {
        // Retry the job - no need to bump processing or totalTried as this does not count as a retry. A condition of a different task might have just opened up!
        return await runJSONJob({
            job,
            req,
            updateJob,
            workflowConfig,
            workflowHandler
        });
    }
};

//# sourceMappingURL=index.js.map