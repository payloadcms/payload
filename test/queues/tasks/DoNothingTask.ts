/* eslint-disable @typescript-eslint/require-await */
import type { TaskConfig } from 'payload'

export const DoNothingTask: TaskConfig<'DoNothingTask'> = {
  retries: 2,
  slug: 'DoNothingTask',
  inputSchema: [
    {
      name: 'message',
      type: 'text',
      required: true,
    },
  ],
  outputSchema: [],
  handler: async ({ input }) => {
    return {
      state: 'succeeded',
      output: {
        message: input.message,
      },
    }
  },
}
