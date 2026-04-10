import { JobCancelledError, type TaskConfig } from 'payload'

export const SelfCancelTask: TaskConfig<'SelfCancel'> = {
  slug: 'SelfCancel',
  inputSchema: [
    {
      name: 'shouldCancel',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
  outputSchema: [],
  // Set to 4, to test that this job is not retried despite the task level retries being set to 4
  retries: 4,
  handler: ({ input }) => {
    if (input.shouldCancel) {
      console.log('222throwing error')
      throw new JobCancelledError('Task was cancelled')
    }
    throw new Error('Failed, not cancelled')
  },
}
