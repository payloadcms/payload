import ObjectIdImport from 'bson-objectid';
import { JobCancelledError, TaskError } from '../../../errors/index.js';
import { getCurrentDate } from '../../../utilities/getCurrentDate.js';
import { getTaskHandlerFromConfig } from './importHandlerPath.js';
const ObjectId = 'default' in ObjectIdImport ? ObjectIdImport.default : ObjectIdImport;
export const getRunTaskFunction = (job, workflowConfig, req, isInline, updateJob, parent)=>{
    const jobConfig = req.payload.config.jobs;
    const runTask = (taskSlug)=>async (taskID, { input, retries, // Only available for inline tasks:
        task })=>{
            const executedAt = getCurrentDate();
            let taskConfig;
            if (!isInline) {
                taskConfig = jobConfig.tasks?.length && jobConfig.tasks.find((t)=>t.slug === taskSlug);
                if (!taskConfig) {
                    throw new Error(`Task ${taskSlug} not found in workflow ${job.workflowSlug}`);
                }
            }
            const retriesConfigFromPropsNormalized = retries == undefined || retries == null ? {} : typeof retries === 'number' ? {
                attempts: retries
            } : retries;
            const retriesConfigFromTaskConfigNormalized = taskConfig ? typeof taskConfig.retries === 'number' ? {
                attempts: taskConfig.retries
            } : taskConfig.retries : {};
            const finalRetriesConfig = {
                ...retriesConfigFromTaskConfigNormalized,
                ...retriesConfigFromPropsNormalized
            };
            const taskStatus = job?.taskStatus?.[taskSlug] ? job.taskStatus[taskSlug][taskID] : null;
            // Handle restoration of task if it succeeded in a previous run
            if (taskStatus && taskStatus.complete === true) {
                let shouldRestore = true;
                if (finalRetriesConfig?.shouldRestore === false) {
                    shouldRestore = false;
                } else if (typeof finalRetriesConfig?.shouldRestore === 'function') {
                    shouldRestore = await finalRetriesConfig.shouldRestore({
                        input,
                        job,
                        req,
                        taskStatus
                    });
                }
                if (shouldRestore) {
                    return taskStatus.output;
                }
            }
            const runner = isInline ? task : await getTaskHandlerFromConfig(taskConfig);
            if (!runner || typeof runner !== 'function') {
                throw new TaskError({
                    executedAt,
                    input,
                    job,
                    message: isInline ? `Inline task with ID ${taskID} does not have a valid handler.` : `Task with slug ${taskSlug} in workflow ${job.workflowSlug} does not have a valid handler.`,
                    parent,
                    retriesConfig: finalRetriesConfig,
                    taskConfig,
                    taskID,
                    taskSlug,
                    taskStatus,
                    workflowConfig
                });
            }
            let taskHandlerResult;
            let output = {};
            try {
                taskHandlerResult = await runner({
                    inlineTask: getRunTaskFunction(job, workflowConfig, req, true, updateJob, {
                        taskID,
                        taskSlug
                    }),
                    input,
                    job: job,
                    req,
                    tasks: getRunTaskFunction(job, workflowConfig, req, false, updateJob, {
                        taskID,
                        taskSlug
                    })
                });
            } catch (err) {
                if (err instanceof JobCancelledError) {
                    // Re-throw JobCancelledError to be handled by the top-level error handler
                    throw err;
                }
                throw new TaskError({
                    executedAt,
                    input: input,
                    job,
                    message: err.message || 'Task handler threw an error',
                    output,
                    parent,
                    retriesConfig: finalRetriesConfig,
                    taskConfig,
                    taskID,
                    taskSlug,
                    taskStatus,
                    workflowConfig
                });
            }
            if (taskHandlerResult.state === 'failed') {
                throw new TaskError({
                    executedAt,
                    input: input,
                    job,
                    message: taskHandlerResult.errorMessage ?? 'Task handler returned a failed state',
                    output,
                    parent,
                    retriesConfig: finalRetriesConfig,
                    taskConfig,
                    taskID,
                    taskSlug,
                    taskStatus,
                    workflowConfig
                });
            } else {
                output = taskHandlerResult.output;
            }
            if (taskConfig?.onSuccess) {
                await taskConfig.onSuccess({
                    input,
                    job,
                    req,
                    taskStatus
                });
            }
            const newLogItem = {
                id: new ObjectId().toHexString(),
                completedAt: getCurrentDate().toISOString(),
                executedAt: executedAt.toISOString(),
                input,
                output,
                parent: jobConfig.addParentToTaskLog ? parent : undefined,
                state: 'succeeded',
                taskID,
                taskSlug
            };
            await updateJob({
                log: {
                    $push: newLogItem
                },
                // Set to null to skip main row update on postgres. 2 => 1 db round trips
                updatedAt: null
            });
            return output;
        };
    if (isInline) {
        return runTask('inline');
    } else {
        const tasks = {};
        for (const task of jobConfig.tasks ?? []){
            tasks[task.slug] = runTask(task.slug);
        }
        return tasks;
    }
};

//# sourceMappingURL=getRunTaskFunction.js.map