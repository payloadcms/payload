import * as z from 'zod/mini'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'

export const createJobsRunCommand = defineCLICommand({
  description: 'Run queued jobs.',
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()

    if (args.handleSchedules) {
      await payload.jobs.handleSchedules({
        allQueues: args.allQueues,
        queue: args.queue,
      })
    }

    await payload.jobs.run({
      allQueues: args.allQueues,
      limit: args.limit,
      queue: args.queue,
    })
  },
  helpGroup: 'Core commands',
  input: strictObject({
    allQueues: z.optional(z.boolean()).check(z.describe('Run jobs from all queues.')),
    handleSchedules: z
      .optional(z.boolean())
      .check(z.describe('Queue due scheduled jobs before running.')),
    limit: z
      .optional(z.int().check(z.positive()))
      .check(z.describe('Maximum number of jobs to run.')),
    queue: z.optional(z.string()).check(z.describe('Only run jobs from this queue.')),
  }),
})
