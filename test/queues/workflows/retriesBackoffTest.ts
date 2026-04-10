import type { WorkflowConfig } from 'payload'

export const retriesBackoffTestWorkflow: WorkflowConfig<'retriesBackoffTest'> = {
  slug: 'retriesBackoffTest',
  inputSchema: [
    {
      name: 'message',
      type: 'text',
      required: true,
    },
  ],
  handler: async ({ job, inlineTask, req }) => {
    const newJob = await req.payload.update({
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
    job.input = newJob.input as any

    await inlineTask('1', {
      task: async ({ req }) => {
        const totalTried = job?.taskStatus?.inline?.['1']?.totalTried || 0

        const { id } = await req.payload.create({
          collection: 'simple',
          req,
          data: {
            title: 'should not exist',
          },
        })

        // @ts-expect-error timeTried is new arbitrary data and not in the type
        if (!job.input.timeTried) {
          // @ts-expect-error timeTried is new arbitrary data and not in the type
          job.input.timeTried = {}
        }

        // @ts-expect-error timeTried is new arbitrary data and not in the type
        job.input.timeTried[totalTried] = new Date().toISOString()

        const updated = await req.payload.update({
          collection: 'payload-jobs',
          data: {
            input: job.input,
          },
          id: job.id,
        })
        job.input = updated.input as any

        if (totalTried < 4) {
          // Cleanup the post
          await req.payload.delete({
            collection: 'simple',
            id,
            req,
          })

          // Last try it should succeed
          throw new Error('Failed on purpose')
        }
        return {
          output: {},
        }
      },
      retries: {
        attempts: 4,
        backoff: {
          type: 'exponential',
          // Should retry in 300ms, then 600, then 1200, then 2400, then succeed
          delay: 300,
        },
      },
    })
  },
}
