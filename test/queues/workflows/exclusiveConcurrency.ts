import type { WorkflowConfig } from 'payload'

import { wait } from 'payload/shared'

/**
 * A workflow that uses exclusive concurrency to prevent parallel execution
 * of jobs with the same resourceId.
 */
export const exclusiveConcurrencyWorkflow: WorkflowConfig<'exclusiveConcurrency'> = {
  slug: 'exclusiveConcurrency',
  inputSchema: [
    {
      name: 'resourceId',
      type: 'text',
      required: true,
    },
    {
      name: 'delayMs',
      type: 'number',
      required: false,
    },
  ],
  // Jobs with the same resourceId will run exclusively (one at a time)
  concurrency: ({ input }) => `exclusive:${input.resourceId}`,
  handler: async ({ inlineTask, job }) => {
    const delayMs = job.input.delayMs ?? 100

    await inlineTask('step1', {
      task: async ({ req }) => {
        // Create a simple doc to track execution order
        await req.payload.create({
          collection: 'simple',
          data: {
            title: `started:${job.input.resourceId}:${job.id}`,
          },
        })

        // Simulate some work
        await wait(delayMs)

        return { output: {} }
      },
    })

    await inlineTask('step2', {
      task: async ({ req }) => {
        // Create another doc to mark completion
        await req.payload.create({
          collection: 'simple',
          data: {
            title: `completed:${job.input.resourceId}:${job.id}`,
          },
        })

        return { output: {} }
      },
    })
  },
}
