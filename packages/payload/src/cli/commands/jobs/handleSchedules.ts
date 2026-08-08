import * as z from 'zod/mini'

import { defineCLICommand } from '../../defineCLICommand.js'
import { strictObject } from '../../zod.js'

export const createJobsHandleSchedulesCommand = defineCLICommand({
  description: 'Queue due scheduled jobs.',
  handler: async ({ args, getPayload }) => {
    const payload = await getPayload()

    await payload.jobs.handleSchedules(args)
  },
  helpGroup: 'Core commands',
  input: strictObject({
    allQueues: z.optional(z.boolean()).check(z.describe('Handle schedules for all queues.')),
    queue: z.optional(z.string()).check(z.describe('Only handle schedules for this queue.')),
  }),
})
