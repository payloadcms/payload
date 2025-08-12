import type { WorkflowConfig } from 'payload'

/**
 * Should finish after 2 seconds
 */
export const longRunningWorkflow: WorkflowConfig<'longRunning'> = {
  slug: 'longRunning',
  inputSchema: [],
  handler: async ({ inlineTask }) => {
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
  },
}
