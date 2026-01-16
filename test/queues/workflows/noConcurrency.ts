import type { WorkflowConfig } from 'payload'

import { wait } from 'payload/shared'

/**
 * A workflow without concurrency controls - jobs can run in parallel.
 * Used as a control case in concurrency tests.
 */
export const noConcurrencyWorkflow: WorkflowConfig<'noConcurrency'> = {
  slug: 'noConcurrency',
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
