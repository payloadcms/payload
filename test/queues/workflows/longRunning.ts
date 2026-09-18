import type { WorkflowConfig } from 'payload'

/**
 * Should finish after 2 seconds
 */
export const longRunningWorkflow: WorkflowConfig<'longRunning'> = {
  slug: 'longRunning',
  inputSchema: [
    {
      name: 'postTitle',
      type: 'text',
    },
  ],
  // Set to 4, to test that this job is not retried despite the workflow level retries being set to 4
  retries: 4,
  handler: async ({ inlineTask, job, req }) => {
    for (let i = 0; i < 4; i += 1) {
      await inlineTask(String(i), {
        task: async () => {
          // Wait 500ms
          await new Promise((resolve) => setTimeout(resolve, 500))
          return {
            output: {},
          }
        },
      })
    }

    if (job.input.postTitle) {
      await req.payload.create({
        collection: 'posts',
        data: {
          title: job.input.postTitle,
        },
        req,
      })
    }
  },
}
