import { handleSchedules } from '../operations/handleSchedules/index.js';
import { configHasJobs } from './run.js';
/**
 * GET /api/payload-jobs/handle-schedules endpoint
 *
 * This endpoint is GET instead of POST to allow it to be used in a Vercel Cron.
 */ export const handleSchedulesJobsEndpoint = {
    handler: async (req)=>{
        const jobsConfig = req.payload.config.jobs;
        if (!configHasJobs(jobsConfig)) {
            return Response.json({
                message: 'No jobs to schedule.'
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
        if (!jobsConfig.scheduling) {
            // There is no reason to call the handleSchedules endpoint if the stats global is not enabled (= no schedules defined)
            return Response.json({
                message: 'Cannot handle schedules because no tasks or workflows with schedules are defined.'
            }, {
                status: 500
            });
        }
        const { allQueues, queue } = req.query;
        const runAllQueues = allQueues && !(typeof allQueues === 'string' && allQueues === 'false');
        const { errored, queued, skipped } = await handleSchedules({
            allQueues: runAllQueues,
            queue,
            req
        });
        return Response.json({
            errored,
            message: req.i18n.t('general:success'),
            queued,
            skipped
        }, {
            status: 200
        });
    },
    method: 'get',
    path: '/handle-schedules'
};

//# sourceMappingURL=handleSchedules.js.map