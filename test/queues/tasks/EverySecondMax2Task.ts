import { countRunnableOrActiveJobsForQueue, type TaskConfig } from 'payload'

export const EverySecondMax2Task: TaskConfig<'EverySecondMax2'> = {
  schedule: [
    {
      cron: '* * * * * *',
      queue: 'autorunSecondMax2',
      hooks: {
        beforeSchedule: async ({ queueable, req }) => {
          const runnableOrActiveJobsForQueue = await countRunnableOrActiveJobsForQueue({
            queue: queueable.scheduleConfig.queue,
            req,
            taskSlug: queueable.taskConfig?.slug,
            workflowSlug: queueable.workflowConfig?.slug,
          })

          return {
            input: {
              message: 'This task runs every second - max 2 per second',
            },
            shouldSchedule: runnableOrActiveJobsForQueue <= 1,
            waitUntil: queueable.waitUntil,
          }
        },
        afterSchedule: async (args) => {
          await args.defaultAfterSchedule(args) // Handles updating the payload-jobs-stats global
          args.req.payload.logger.info(
            'autorunSecondMax2 task scheduled: ' +
              (args.status === 'success'
                ? String(args.job.id)
                : args.status === 'skipped'
                  ? 'skipped'
                  : 'error'),
          )
        },
      },
    },
  ],
  slug: 'EverySecondMax2',
  inputSchema: [
    {
      name: 'message',
      type: 'text',
      required: true,
    },
  ],
  handler: async ({ input, req }) => {
    req.payload.logger.info(input.message)

    await req.payload.create({
      collection: 'simple',
      data: {
        title: input.message,
      },
      req,
    })
    return {
      output: {},
    }
  },
}
