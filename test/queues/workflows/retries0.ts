import type { WorkflowConfig } from 'payload'

export const retries0Workflow: WorkflowConfig<'workflowRetries0'> = {
  slug: 'workflowRetries0',
  inputSchema: [
    {
      name: 'message',
      type: 'text',
      required: true,
    },
  ],
  retries: 0,
  handler: async ({ job, tasks, req }) => {
    const updatedJob = await req.payload.update({
      collection: 'payload-jobs',
      data: {
        input: {
          ...job.input,
          amountRetried:
            // @ts-expect-error amountRetried is new arbitrary data and not in the type
            job.input.amountRetried !== undefined ? job.input.amountRetried + 1 : 0,
        },
      },
      id: job.id,
    })
    job.input = updatedJob.input as any

    await tasks.CreateSimple('1', {
      input: {
        message: job.input.message,
      },
    })

    // At this point there should always be one post created.
    // job.input.amountRetried will go up to 2 as CreatePost has 2 retries
    await tasks.CreateSimple('2', {
      input: {
        message: job.input.message,
        shouldFail: true,
      },
    })
    // This will never be reached
  },
}
