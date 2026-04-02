import type { TaskConfig } from 'payload'

export const EverySecondTask: TaskConfig<'EverySecond'> = {
  schedule: [
    {
      cron: '* * * * * *',
      queue: 'autorunSecond',
      hooks: {
        beforeSchedule: async (args) => {
          const result = await args.defaultBeforeSchedule(args) // Handles verifying that there are no jobs already scheduled or processing
          return {
            ...result,
            input: {
              message: 'This task runs every second',
            },
          }
        },
        afterSchedule: async (args) => {
          await args.defaultAfterSchedule(args) // Handles updating the payload-jobs-stats global
          args.req.payload.logger.info(
            'EverySecond task scheduled: ' +
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
  slug: 'EverySecond',
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
