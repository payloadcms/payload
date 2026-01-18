import { runJobs } from '../operations/runJobs/index.js';
/**
 * /api/payload-jobs/run endpoint
 *
 * This endpoint is GET instead of POST to allow it to be used in a Vercel Cron.
 */ export const runJobsEndpoint = {
    handler: async (req)=>{
        const jobsConfig = req.payload.config.jobs;
        if (!configHasJobs(jobsConfig)) {
            return Response.json({
                message: 'No jobs to run.'
            }, {
                status: 200
            });
        }
        const accessFn = jobsConfig.access?.run ?? (()=>true);
        const hasAccess = await accessFn({
            req
        });
        if (!hasAccess) {
            return Response.json({
                message: req.i18n.t('error:unauthorized')
            }, {
                status: 401
            });
        }
        const { allQueues, disableScheduling: disableSchedulingParam, limit, queue, silent: silentParam } = req.query;
        const silent = silentParam === 'true';
        const shouldHandleSchedules = disableSchedulingParam !== 'true';
        const runAllQueues = allQueues && !(typeof allQueues === 'string' && allQueues === 'false');
        if (shouldHandleSchedules && jobsConfig.scheduling) {
            // If should handle schedules and schedules are defined
            await req.payload.jobs.handleSchedules({
                allQueues: runAllQueues,
                queue,
                req
            });
        }
        const runJobsArgs = {
            queue,
            req,
            // Access is validated above, so it's safe to override here
            allQueues: runAllQueues,
            overrideAccess: true,
            silent
        };
        if (typeof queue === 'string') {
            runJobsArgs.queue = queue;
        }
        const parsedLimit = Number(limit);
        if (!isNaN(parsedLimit)) {
            runJobsArgs.limit = parsedLimit;
        }
        let noJobsRemaining = false;
        let remainingJobsFromQueried = 0;
        try {
            const result = await runJobs(runJobsArgs);
            noJobsRemaining = !!result.noJobsRemaining;
            remainingJobsFromQueried = result.remainingJobsFromQueried;
        } catch (err) {
            req.payload.logger.error({
                err,
                msg: 'There was an error running jobs:',
                queue: runJobsArgs.queue
            });
            return Response.json({
                message: req.i18n.t('error:unknown'),
                noJobsRemaining: true,
                remainingJobsFromQueried
            }, {
                status: 500
            });
        }
        return Response.json({
            message: req.i18n.t('general:success'),
            noJobsRemaining,
            remainingJobsFromQueried
        }, {
            status: 200
        });
    },
    method: 'get',
    path: '/run'
};
export const configHasJobs = (jobsConfig)=>{
    return Boolean(jobsConfig.tasks?.length || jobsConfig.workflows?.length);
};

//# sourceMappingURL=run.js.map