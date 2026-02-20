import type { WorkflowConfig } from 'payload'

import { wait } from 'payload/shared'

/**
 * A workflow that uses both exclusive and supersedes concurrency.
 * New jobs will delete older pending jobs with the same key.
 */
export const supersedesConcurrencyWorkflow: WorkflowConfig<'supersedesConcurrency'> = {
  slug: 'supersedesConcurrency',
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
  concurrency: {
    key: ({ input, queue }) => `supersedes:${input.resourceId}`,
    exclusive: true,
    supersedes: true,
  },
  handler: async ({ inlineTask, job }) => {
    const delayMs = job.input.delayMs ?? 100

    await inlineTask('step1', {
      task: async ({ req }) => {
        await req.payload.create({
          collection: 'simple',
          data: {
            title: `started:${job.input.resourceId}:${job.id}`,
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
            title: `completed:${job.input.resourceId}:${job.id}`,
          },
        })

        return { output: {} }
      },
    })
  },
}
