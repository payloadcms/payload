import { createLocalReq, Forbidden } from '../index.js';
import { jobAfterRead, jobsCollectionSlug } from './config/collection.js';
import { handleSchedules } from './operations/handleSchedules/index.js';
import { runJobs } from './operations/runJobs/index.js';
import { updateJob, updateJobs } from './utilities/updateJob.js';
export const getJobsLocalAPI = (payload)=>({
        handleSchedules: async (args)=>{
            const newReq = args?.req ?? await createLocalReq({}, payload);
            return await handleSchedules({
                allQueues: args?.allQueues,
                queue: args?.queue,
                req: newReq
            });
        },
        queue: async (args)=>{
            const overrideAccess = args?.overrideAccess !== false;
            const req = args.req ?? await createLocalReq({}, payload);
            if (!overrideAccess) {
                /**
       * By default, jobsConfig.access.queue will be `defaultAccess` which is a function that returns `true` if the user is logged in.
       */ const accessFn = payload.config.jobs?.access?.queue ?? (()=>true);
                const hasAccess = await accessFn({
                    req
                });
                if (!hasAccess) {
                    throw new Forbidden(req.t);
                }
            }
            let queue = undefined;
            // If user specifies queue, use that
            if (args.queue) {
                queue = args.queue;
            } else if (args.workflow) {
                // Otherwise, if there is a workflow specified, and it has a default queue to use,
                // use that
                const workflow = payload.config.jobs?.workflows?.find(({ slug })=>slug === args.workflow);
                if (workflow?.queue) {
                    queue = workflow.queue;
                }
            }
            const data = {
                input: args.input
            };
            if (queue) {
                data.queue = queue;
            }
            if (args.waitUntil) {
                data.waitUntil = args.waitUntil?.toISOString();
            }
            if (args.workflow) {
                data.workflowSlug = args.workflow;
            }
            if (args.task) {
                data.taskSlug = args.task;
            }
            if (args.meta) {
                data.meta = args.meta;
            }
            // Compute concurrency key from workflow or task config (only if feature is enabled)
            if (payload.config.jobs?.enableConcurrencyControl) {
                let concurrencyKey = null;
                let supersedes = false;
                const queueName = queue || 'default';
                if (args.workflow) {
                    const workflow = payload.config.jobs?.workflows?.find(({ slug })=>slug === args.workflow);
                    if (workflow?.concurrency) {
                        const concurrencyConfig = workflow.concurrency;
                        if (typeof concurrencyConfig === 'function') {
                            concurrencyKey = concurrencyConfig({
                                input: args.input,
                                queue: queueName
                            });
                        } else {
                            concurrencyKey = concurrencyConfig.key({
                                input: args.input,
                                queue: queueName
                            });
                            supersedes = concurrencyConfig.supersedes ?? false;
                        }
                    }
                } else if (args.task) {
                    const task = payload.config.jobs?.tasks?.find(({ slug })=>slug === args.task);
                    if (task?.concurrency) {
                        const concurrencyConfig = task.concurrency;
                        if (typeof concurrencyConfig === 'function') {
                            concurrencyKey = concurrencyConfig({
                                input: args.input,
                                queue: queueName
                            });
                        } else {
                            concurrencyKey = concurrencyConfig.key({
                                input: args.input,
                                queue: queueName
                            });
                            supersedes = concurrencyConfig.supersedes ?? false;
                        }
                    }
                }
                if (concurrencyKey) {
                    data.concurrencyKey = concurrencyKey;
                    // If supersedes is enabled, delete older pending jobs with the same key
                    if (supersedes) {
                        if (payload.config.jobs.runHooks) {
                            await payload.delete({
                                collection: jobsCollectionSlug,
                                depth: 0,
                                disableTransaction: true,
                                where: {
                                    and: [
                                        {
                                            concurrencyKey: {
                                                equals: concurrencyKey
                                            }
                                        },
                                        {
                                            processing: {
                                                equals: false
                                            }
                                        },
                                        {
                                            completedAt: {
                                                exists: false
                                            }
                                        }
                                    ]
                                }
                            });
                        } else {
                            await payload.db.deleteMany({
                                collection: jobsCollectionSlug,
                                req,
                                where: {
                                    and: [
                                        {
                                            concurrencyKey: {
                                                equals: concurrencyKey
                                            }
                                        },
                                        {
                                            processing: {
                                                equals: false
                                            }
                                        },
                                        {
                                            completedAt: {
                                                exists: false
                                            }
                                        }
                                    ]
                                }
                            });
                        }
                    }
                }
            }
            // Type assertion is still needed here
            if (payload?.config?.jobs?.depth || payload?.config?.jobs?.runHooks) {
                return await payload.create({
                    collection: jobsCollectionSlug,
                    data,
                    depth: payload.config.jobs.depth ?? 0,
                    overrideAccess,
                    req
                });
            } else {
                return jobAfterRead({
                    config: payload.config,
                    doc: await payload.db.create({
                        collection: jobsCollectionSlug,
                        data,
                        req
                    })
                });
            }
        },
        run: async (args)=>{
            const newReq = args?.req ?? await createLocalReq({}, payload);
            return await runJobs({
                allQueues: args?.allQueues,
                limit: args?.limit,
                overrideAccess: args?.overrideAccess !== false,
                processingOrder: args?.processingOrder,
                queue: args?.queue,
                req: newReq,
                sequential: args?.sequential,
                silent: args?.silent,
                where: args?.where
            });
        },
        runByID: async (args)=>{
            const newReq = args.req ?? await createLocalReq({}, payload);
            return await runJobs({
                id: args.id,
                overrideAccess: args.overrideAccess !== false,
                req: newReq,
                silent: args.silent
            });
        },
        cancel: async (args)=>{
            const req = args.req ?? await createLocalReq({}, payload);
            const overrideAccess = args.overrideAccess !== false;
            if (!overrideAccess) {
                /**
       * By default, jobsConfig.access.cancel will be `defaultAccess` which is a function that returns `true` if the user is logged in.
       */ const accessFn = payload.config.jobs?.access?.cancel ?? (()=>true);
                const hasAccess = await accessFn({
                    req
                });
                if (!hasAccess) {
                    throw new Forbidden(req.t);
                }
            }
            const and = [
                args.where,
                {
                    completedAt: {
                        exists: false
                    }
                },
                {
                    hasError: {
                        not_equals: true
                    }
                }
            ];
            if (args.queue) {
                and.push({
                    queue: {
                        equals: args.queue
                    }
                });
            }
            await updateJobs({
                data: {
                    completedAt: null,
                    error: {
                        cancelled: true
                    },
                    hasError: true,
                    processing: false,
                    waitUntil: null
                },
                depth: 0,
                disableTransaction: true,
                req,
                returning: false,
                where: {
                    and
                }
            });
        },
        cancelByID: async (args)=>{
            const req = args.req ?? await createLocalReq({}, payload);
            const overrideAccess = args.overrideAccess !== false;
            if (!overrideAccess) {
                /**
       * By default, jobsConfig.access.cancel will be `defaultAccess` which is a function that returns `true` if the user is logged in.
       */ const accessFn = payload.config.jobs?.access?.cancel ?? (()=>true);
                const hasAccess = await accessFn({
                    req
                });
                if (!hasAccess) {
                    throw new Forbidden(req.t);
                }
            }
            await updateJob({
                id: args.id,
                data: {
                    completedAt: null,
                    error: {
                        cancelled: true
                    },
                    hasError: true,
                    processing: false,
                    waitUntil: null
                },
                depth: 0,
                disableTransaction: true,
                req,
                returning: false
            });
        }
    });

//# sourceMappingURL=localAPI.js.map