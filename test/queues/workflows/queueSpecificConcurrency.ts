import type { WorkflowConfig } from 'payload'

import { wait } from 'payload/shared'

/**
 * A workflow that includes the queue name in the concurrency key,
 * allowing the same resource to be processed concurrently in different queues.
 */
export const queueSpecificConcurrencyWorkflow: WorkflowConfig<'queueSpecificConcurrency'> = {
  slug: 'queueSpecificConcurrency',
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
  // Include queue name in the key for queue-specific concurrency
  concurrency: ({ input, queue }) => `${queue}:exclusive:${input.resourceId}`,
  handler: async ({ inlineTask, job }) => {
    const delayMs = job.input.delayMs ?? 100

    await inlineTask('step1', {
      task: async ({ req }) => {
        await req.payload.create({
          collection: 'simple',
          data: {
            title: `started:${job.queue}:${job.input.resourceId}:${job.id}`,
          },
        })

        await wait(delayMs)

        return { output: {} }
      },
    })

    await inlineTask('step2', {
      task: async ({ req }) => {
        await req.payload.create({
          collection: 'simple',
          data: {
            title: `completed:${job.queue}:${job.input.resourceId}:${job.id}`,
          },
        })

        return { output: {} }
      },
    })
  },
}
